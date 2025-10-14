#!/usr/bin/env python3
"""
ML Training Service - 使用示例
展示如何使用 ML Training Service 進行模型訓練和測試
"""

from services import MLTrainingService

def example_1_basic_training():
    """示例 1: 基本訓練"""
    print("=" * 80)
    print("  示例 1: 基本訓練")
    print("=" * 80)
    
    service = MLTrainingService(
        base_model="mistralai/Mistral-7B-Instruct-v0.2",
        dataset_path="contract_bug_dataset.jsonl",
        output_dir="../lora_models"
    )
    
    # 訓練模型（僅 1 epoch 用於演示）
    results = service.train_model(num_epochs=1, batch_size=2)
    
    print(f"\n訓練完成！")
    print(f"  時間: {results['train_time']:.2f} 秒")
    print(f"  Loss: {results['final_loss']:.4f}")


def example_2_test_model():
    """示例 2: 測試模型"""
    print("\n" + "=" * 80)
    print("  示例 2: 測試模型")
    print("=" * 80)
    
    service = MLTrainingService(
        output_dir="../lora_models"
    )
    
    # 測試模型
    results = service.test_model()
    
    print(f"\n測試完成！")
    print(f"  準確率: {results['summary']['accuracy']:.1f}%")
    print(f"  正確數量: {results['summary']['correct_count']}/{results['summary']['total_samples']}")


def example_3_cross_validation():
    """示例 3: 交叉驗證"""
    print("\n" + "=" * 80)
    print("  示例 3: 3-Fold 交叉驗證")
    print("=" * 80)
    
    service = MLTrainingService(
        base_model="mistralai/Mistral-7B-Instruct-v0.2",
        dataset_path="contract_bug_dataset.jsonl",
        output_dir="../lora_models"
    )
    
    # 執行交叉驗證
    results = service.cross_validate(n_folds=3)
    
    print(f"\n交叉驗證完成！")
    print(f"  平均準確率: {results['avg_accuracy']:.1f}% ± {results['std_accuracy']:.1f}%")


def example_4_custom_samples():
    """示例 4: 使用自定義樣本測試"""
    print("\n" + "=" * 80)
    print("  示例 4: 自定義樣本測試")
    print("=" * 80)
    
    service = MLTrainingService(output_dir="../lora_models")
    
    # 自定義測試樣本
    custom_samples = [
        {
            "instruction": "找出Sui smart contract的惡意漏洞，並判斷是哪種漏洞類型",
            "input": "public fun withdraw(coin: Coin, amount: u64) { coin.balance = coin.balance - amount; }",
            "output": "漏洞類型：Arithmetic Overflow，未做下溢檢查"
        },
        {
            "instruction": "找出Sui smart contract的惡意漏洞，並判斷是哪種漏洞類型",
            "input": "public fun delete(item: Item) { assert!(item.owner == sender); item.delete(); }",
            "output": "未發現明顯漏洞"
        }
    ]
    
    # 測試自定義樣本
    results = service.test_model(test_samples=custom_samples)
    
    print(f"\n測試完成！")
    print(f"  準確率: {results['summary']['accuracy']:.1f}%")


def example_5_load_and_check_dataset():
    """示例 5: 載入和檢查數據集"""
    print("\n" + "=" * 80)
    print("  示例 5: 數據集檢查")
    print("=" * 80)
    
    service = MLTrainingService(dataset_path="contract_bug_dataset.jsonl")
    
    # 載入數據集
    samples = service.load_dataset()
    
    print(f"\n數據集統計:")
    print(f"  總樣本數: {len(samples)}")
    
    # 統計各類型數量
    vuln_counts = {}
    for sample in samples:
        vuln_type = service._extract_vulnerability_type(sample['output'])
        vuln_counts[vuln_type] = vuln_counts.get(vuln_type, 0) + 1
    
    print(f"\n  漏洞類型分布:")
    for vtype, count in sorted(vuln_counts.items()):
        print(f"    {vtype}: {count} 樣本")


if __name__ == "__main__":
    import sys
    
    print("\n🎓 ML Training Service - 使用示例")
    print("=" * 80)
    
    if len(sys.argv) > 1:
        example_num = sys.argv[1]
        
        if example_num == "1":
            example_1_basic_training()
        elif example_num == "2":
            example_2_test_model()
        elif example_num == "3":
            example_3_cross_validation()
        elif example_num == "4":
            example_4_custom_samples()
        elif example_num == "5":
            example_5_load_and_check_dataset()
        else:
            print(f"❌ 未知示例編號: {example_num}")
            print("\n可用示例:")
            print("  1 - 基本訓練")
            print("  2 - 測試模型")
            print("  3 - 交叉驗證")
            print("  4 - 自定義樣本測試")
            print("  5 - 數據集檢查")
    else:
        print("\n使用方式:")
        print("  python ml/examples.py <示例編號>")
        print("\n可用示例:")
        print("  1 - 基本訓練")
        print("  2 - 測試模型")
        print("  3 - 交叉驗證")
        print("  4 - 自定義樣本測試")
        print("  5 - 數據集檢查")
        print("\n範例:")
        print("  python ml/examples.py 5  # 執行示例 5 (數據集檢查)")
