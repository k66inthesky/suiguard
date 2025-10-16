#!/usr/bin/env python3
"""
ML Training CLI
命令行界面用於訓練和測試漏洞檢測模型
"""

import argparse
import sys
import os

# 添加項目根目錄到路徑
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from services.ml_training_service import MLTrainingService


def main():
    parser = argparse.ArgumentParser(
        description='SuiGuard ML 訓練和測試工具',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
使用範例:
  # 訓練模型
  python ml/ml_cli.py --train --epochs 3
  
  # 測試模型
  python ml/ml_cli.py --test
  
  # 交叉驗證
  python ml/ml_cli.py --cross-validate --folds 3
  
  # 自定義模型和數據集
  python ml/ml_cli.py --train --model mistralai/Mistral-7B-Instruct-v0.2 --dataset my_data.jsonl
        """
    )
    
    # 操作模式
    mode_group = parser.add_mutually_exclusive_group(required=True)
    mode_group.add_argument('--train', action='store_true', help='訓練模型')
    mode_group.add_argument('--test', action='store_true', help='測試模型')
    mode_group.add_argument('--cross-validate', action='store_true', help='執行交叉驗證')
    
    # 模型參數
    parser.add_argument('--model', type=str, 
                       default='mistralai/Mistral-7B-Instruct-v0.2',
                       help='基礎模型名稱 (default: Mistral-7B-Instruct-v0.2)')
    
    parser.add_argument('--dataset', type=str,
                       default='contract_bug_dataset.jsonl',
                       help='數據集路徑 (default: contract_bug_dataset.jsonl)')
    
    parser.add_argument('--output', type=str,
                       default='../lora_models',
                       help='模型輸出目錄 (default: ../lora_models)')
    
    # 訓練參數
    parser.add_argument('--epochs', type=int, default=3,
                       help='訓練輪數 (default: 3)')
    
    parser.add_argument('--batch-size', type=int, default=2,
                       help='批次大小 (default: 2)')
    
    parser.add_argument('--learning-rate', type=float, default=3e-4,
                       help='學習率 (default: 3e-4)')
    
    parser.add_argument('--lora-r', type=int, default=8,
                       help='LoRA 秩 (default: 8)')
    
    parser.add_argument('--lora-alpha', type=int, default=16,
                       help='LoRA alpha (default: 16)')
    
    parser.add_argument('--lora-dropout', type=float, default=0.05,
                       help='LoRA dropout (default: 0.05)')
    
    parser.add_argument('--no-8bit', action='store_true',
                       help='不使用 8-bit 量化')
    
    # 交叉驗證參數
    parser.add_argument('--folds', type=int, default=3,
                       help='交叉驗證折數 (default: 3)')
    
    # 測試參數
    parser.add_argument('--model-path', type=str,
                       help='測試時使用的模型路徑 (default: 使用 --output 的值)')
    
    args = parser.parse_args()
    
    # 創建服務實例
    service = MLTrainingService(
        base_model=args.model,
        dataset_path=args.dataset,
        output_dir=args.output
    )
    
    try:
        if args.train:
            # 訓練模式
            print("\n🚀 開始訓練模式\n")
            results = service.train_model(
                num_epochs=args.epochs,
                batch_size=args.batch_size,
                learning_rate=args.learning_rate,
                lora_r=args.lora_r,
                lora_alpha=args.lora_alpha,
                lora_dropout=args.lora_dropout,
                use_8bit=not args.no_8bit
            )
            print("\n✅ 訓練完成！")
            print(f"模型保存位置: {results['model_path']}")
            print(f"訓練時間: {results['train_time']:.2f} 秒")
            print(f"最終 Loss: {results['final_loss']:.4f}")
            
        elif args.test:
            # 測試模式
            print("\n🧪 開始測試模式\n")
            model_path = args.model_path or args.output
            
            if not os.path.exists(model_path):
                print(f"❌ 錯誤: 模型路徑不存在: {model_path}")
                print(f"請先訓練模型或指定正確的模型路徑")
                sys.exit(1)
            
            results = service.test_model(model_path=model_path)
            print("\n✅ 測試完成！")
            print(f"準確率: {results['summary']['accuracy']:.1f}%")
            print(f"正確數量: {results['summary']['correct_count']}/{results['summary']['total_samples']}")
            
        elif args.cross_validate:
            # 交叉驗證模式
            print(f"\n🎯 開始 {args.folds}-Fold 交叉驗證\n")
            results = service.cross_validate(n_folds=args.folds)
            print("\n✅ 交叉驗證完成！")
            print(f"平均準確率: {results['avg_accuracy']:.1f}% ± {results['std_accuracy']:.1f}%")
    
    except KeyboardInterrupt:
        print("\n\n⚠️ 操作被用戶中斷")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ 錯誤: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
