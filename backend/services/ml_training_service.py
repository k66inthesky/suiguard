"""
ML Training Service
機器學習模型訓練和測試服務
負責 LoRA 微調模型的訓練、驗證和評估
"""

import json
import time
import os
from datetime import datetime
from typing import Dict, List, Tuple, Optional
import torch
from transformers import (
    AutoTokenizer,
    AutoModelForCausalLM,
    TrainingArguments,
    Trainer,
    DataCollatorForLanguageModeling
)
from peft import LoraConfig, get_peft_model, PeftModel, AutoPeftModelForCausalLM
from datasets import Dataset
import numpy as np

class MLTrainingService:
    """ML 訓練服務類"""
    
    # 定義標準漏洞類型
    VULNERABILITY_TYPES = {
        'Resource Leak': ['resource leak', '資源洩漏', '資源泄漏', '資源'],
        'Arithmetic Overflow': ['arithmetic overflow', '算術溢位', '算术溢出', '溢位', '溢出'],
        'Unchecked Return': ['unchecked return', '未檢查返回', '未检查返回', '返回值', '未檢查', '未检查'],
        'Cross-Module Pollution': ['cross-module pollution', '跨模組污染', '跨模块污染', '模組污染', '模块污染'],
        'Capability Leak': ['capability leak', '權限洩漏', '权限泄漏', '權限', '权限', 'capability', '權限檢查', '权限检查'],
        '未發現明顯漏洞': ['未發現', '未发现', '安全', 'safe', '無漏洞', '无漏洞']
    }
    
    def __init__(self, 
                 base_model: str = "mistralai/Mistral-7B-Instruct-v0.2",
                 dataset_path: str = "ml/contract_bug_dataset.jsonl",
                 output_dir: str = "./lora_models"):
        """
        初始化 ML 訓練服務
        
        Args:
            base_model: 基礎模型名稱
            dataset_path: 訓練數據集路徑
            output_dir: 模型輸出目錄
        """
        self.base_model = base_model
        self.dataset_path = dataset_path
        self.output_dir = output_dir
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        
    def load_dataset(self, path: Optional[str] = None) -> List[Dict]:
        """
        載入訓練數據集
        
        Args:
            path: 數據集路徑，如果為 None 則使用默認路徑
            
        Returns:
            樣本列表
        """
        path = path or self.dataset_path
        samples = []
        
        with open(path, 'r', encoding='utf-8') as f:
            for line_num, line in enumerate(f, 1):
                line = line.strip()
                # 跳過註釋和空行
                if line.startswith('//') or line.startswith('#') or not line:
                    continue
                try:
                    data = json.loads(line)
                    data['line_number'] = line_num
                    samples.append(data)
                except json.JSONDecodeError as e:
                    print(f"⚠️ 警告：第 {line_num} 行 JSON 解析錯誤: {e}")
                    continue
                    
        print(f"✅ 載入了 {len(samples)} 個訓練樣本")
        return samples
    
    def prepare_training_data(self, samples: List[Dict]) -> Dict:
        """
        準備訓練數據格式
        
        Args:
            samples: 原始樣本列表
            
        Returns:
            格式化的訓練數據
        """
        texts = []
        for sample in samples:
            # 構建完整的訓練文本
            text = f"{sample['instruction']}\n{sample['input']}\n{sample['output']}"
            texts.append(text)
        
        return {"text": texts}
    
    def train_model(self,
                   num_epochs: int = 3,
                   batch_size: int = 2,
                   learning_rate: float = 3e-4,
                   lora_r: int = 8,
                   lora_alpha: int = 16,
                   lora_dropout: float = 0.05,
                   use_8bit: bool = True) -> Dict:
        """
        訓練 LoRA 微調模型
        
        Args:
            num_epochs: 訓練輪數
            batch_size: 批次大小
            learning_rate: 學習率
            lora_r: LoRA 秩
            lora_alpha: LoRA alpha 參數
            lora_dropout: LoRA dropout
            use_8bit: 是否使用 8-bit 量化
            
        Returns:
            訓練結果統計
        """
        print("=" * 80)
        print("  🚀 開始訓練 LoRA 模型")
        print("=" * 80)
        print(f"基礎模型: {self.base_model}")
        print(f"輸出目錄: {self.output_dir}")
        print(f"訓練輪數: {num_epochs}")
        print(f"批次大小: {batch_size}")
        print(f"學習率: {learning_rate}")
        print(f"LoRA 秩: {lora_r}")
        print()
        
        # 載入數據
        samples = self.load_dataset()
        train_data = self.prepare_training_data(samples)
        train_dataset = Dataset.from_dict(train_data)
        
        # 載入 tokenizer
        print("📥 載入 tokenizer...")
        tokenizer = AutoTokenizer.from_pretrained(self.base_model)
        tokenizer.pad_token = tokenizer.eos_token
        
        # Tokenize 數據
        def tokenize_function(examples):
            return tokenizer(examples["text"], truncation=True, max_length=512, padding=False)
        
        tokenized_dataset = train_dataset.map(
            tokenize_function, 
            batched=True, 
            remove_columns=["text"]
        )
        
        # 載入基礎模型
        print("📥 載入基礎模型...")
        model_kwargs = {
            "device_map": "auto",
            "torch_dtype": torch.float16
        }
        
        if use_8bit:
            model_kwargs["load_in_8bit"] = True
            
        model = AutoModelForCausalLM.from_pretrained(
            self.base_model,
            **model_kwargs
        )
        
        # 配置 LoRA
        print("⚙️ 配置 LoRA...")
        lora_config = LoraConfig(
            r=lora_r,
            lora_alpha=lora_alpha,
            target_modules=["q_proj", "v_proj"],
            lora_dropout=lora_dropout,
            bias="none",
            task_type="CAUSAL_LM"
        )
        
        model = get_peft_model(model, lora_config)
        model.print_trainable_parameters()
        
        # 訓練參數
        training_args = TrainingArguments(
            output_dir=self.output_dir,
            num_train_epochs=num_epochs,
            per_device_train_batch_size=batch_size,
            gradient_accumulation_steps=1,
            learning_rate=learning_rate,
            logging_steps=10,
            save_strategy="epoch",
            save_total_limit=2,
            fp16=True,
            optim="adamw_torch",
            report_to="none"
        )
        
        # 數據整理器
        data_collator = DataCollatorForLanguageModeling(
            tokenizer=tokenizer,
            mlm=False
        )
        
        # 訓練器
        trainer = Trainer(
            model=model,
            args=training_args,
            train_dataset=tokenized_dataset,
            data_collator=data_collator,
        )
        
        # 開始訓練
        print("🔥 開始訓練...")
        start_time = time.time()
        train_result = trainer.train()
        train_time = time.time() - start_time
        
        # 保存模型
        print("💾 保存模型...")
        model.save_pretrained(self.output_dir)
        tokenizer.save_pretrained(self.output_dir)
        
        # 訓練統計
        training_stats = {
            "train_time": round(train_time, 2),
            "train_samples": len(samples),
            "num_epochs": num_epochs,
            "final_loss": float(train_result.training_loss),
            "model_path": self.output_dir,
            "timestamp": datetime.now().isoformat()
        }
        
        # 保存訓練統計
        stats_path = os.path.join(self.output_dir, "training_stats.json")
        with open(stats_path, 'w', encoding='utf-8') as f:
            json.dump(training_stats, f, ensure_ascii=False, indent=2)
        
        print(f"\n✅ 訓練完成！")
        print(f"   時間: {train_time:.2f} 秒 ({train_time/60:.2f} 分鐘)")
        print(f"   最終 Loss: {train_result.training_loss:.4f}")
        print(f"   模型保存到: {self.output_dir}")
        print("=" * 80)
        
        return training_stats
    
    def test_model(self, 
                  model_path: Optional[str] = None,
                  test_samples: Optional[List[Dict]] = None) -> Dict:
        """
        測試訓練好的模型
        
        Args:
            model_path: 模型路徑，如果為 None 則使用默認輸出目錄
            test_samples: 測試樣本，如果為 None 則使用完整數據集
            
        Returns:
            測試結果統計
        """
        model_path = model_path or self.output_dir
        
        print("=" * 80)
        print("  🧪 測試模型")
        print("=" * 80)
        print(f"模型路徑: {model_path}")
        
        # 載入測試數據
        if test_samples is None:
            test_samples = self.load_dataset()
        
        print(f"測試樣本數: {len(test_samples)}")
        
        # 載入模型
        print("\n📥 載入模型...")
        tokenizer = AutoTokenizer.from_pretrained(model_path)
        
        model = AutoPeftModelForCausalLM.from_pretrained(
            model_path,
            device_map={"": self.device},
            torch_dtype=torch.float16 if self.device == "cuda" else torch.float32
        )
        model.eval()
        
        print("✅ 模型載入完成\n")
        
        # 測試
        results = []
        correct = 0
        total_time = 0
        total_similarity = 0
        
        # 按漏洞類型統計
        vuln_stats = {}
        
        print("=" * 80)
        print("  開始測試...")
        print("=" * 80)
        print()
        
        for i, sample in enumerate(test_samples, 1):
            instruction = sample['instruction']
            input_text = sample['input']
            expected = sample['output']
            
            # 推理
            output, inference_time = self._inference(
                model, tokenizer, instruction, input_text
            )
            
            # 計算相似度
            similarity = self._calculate_similarity(expected, output)
            is_correct = similarity >= 70
            
            if is_correct:
                correct += 1
            
            total_time += inference_time
            total_similarity += similarity
            
            # 提取漏洞類型
            vuln_type = self._extract_vulnerability_type(expected)
            
            if vuln_type not in vuln_stats:
                vuln_stats[vuln_type] = {'total': 0, 'correct': 0}
            vuln_stats[vuln_type]['total'] += 1
            if is_correct:
                vuln_stats[vuln_type]['correct'] += 1
            
            status = "✅" if is_correct else "❌"
            print(f"{status} 樣本 {i:2d}/{len(test_samples)} | 相似度: {similarity:3d}% | 時間: {inference_time:.2f}s | {vuln_type}")
            
            results.append({
                'sample_id': i,
                'instruction': instruction,
                'input': input_text,
                'expected': expected,
                'actual': output,
                'similarity': similarity,
                'correct': is_correct,
                'inference_time': inference_time,
                'vulnerability_type': vuln_type
            })
        
        # 計算統計
        accuracy = (correct / len(test_samples)) * 100
        avg_similarity = total_similarity / len(test_samples)
        avg_time = total_time / len(test_samples)
        
        # 顯示結果
        print()
        print("=" * 80)
        print("  📊 測試結果總結")
        print("=" * 80)
        print(f"測試樣本數: {len(test_samples)}")
        print(f"✅ 正確數量: {correct}")
        print(f"❌ 錯誤數量: {len(test_samples) - correct}")
        print(f"準確率: {accuracy:.1f}%")
        print(f"平均相似度: {avg_similarity:.1f}%")
        print(f"平均推理時間: {avg_time:.2f} 秒")
        print(f"總推理時間: {total_time:.2f} 秒")
        print()
        print("=" * 80)
        print("  📋 按漏洞類型分析")
        print("=" * 80)
        
        for vtype in sorted(vuln_stats.keys()):
            stat = vuln_stats[vtype]
            acc = (stat['correct'] / stat['total'] * 100) if stat['total'] > 0 else 0
            print(f"{vtype}: {stat['correct']}/{stat['total']} ({acc:.1f}%)")
        
        print("=" * 80)
        
        # 保存結果
        test_results = {
            'test_time': datetime.now().isoformat(),
            'model_path': model_path,
            'summary': {
                'total_samples': len(test_samples),
                'correct_count': correct,
                'accuracy': round(accuracy, 2),
                'avg_similarity': round(avg_similarity, 2),
                'avg_time': round(avg_time, 4),
                'total_time': round(total_time, 2)
            },
            'vulnerability_stats': vuln_stats,
            'results': results
        }
        
        # 保存到文件
        results_path = os.path.join(model_path, "test_results.json")
        with open(results_path, 'w', encoding='utf-8') as f:
            json.dump(test_results, f, ensure_ascii=False, indent=2)
        
        print(f"✅ 詳細結果已保存到: {results_path}")
        print("=" * 80)
        
        return test_results
    
    def _inference(self, model, tokenizer, instruction: str, input_text: str) -> Tuple[str, float]:
        """執行推理"""
        prompt = f"{instruction}\n{input_text}"
        
        inputs = tokenizer(prompt, return_tensors="pt", truncation=True, max_length=512)
        
        if self.device == "cuda":
            inputs = {k: v.cuda() for k, v in inputs.items()}
        
        start_time = time.time()
        with torch.no_grad():
            outputs = model.generate(
                **inputs,
                max_new_tokens=128,
                temperature=0.7,
                do_sample=True,
                top_p=0.9,
                repetition_penalty=1.1,
                pad_token_id=tokenizer.eos_token_id
            )
        inference_time = time.time() - start_time
        
        full_output = tokenizer.decode(outputs[0], skip_special_tokens=True)
        
        if full_output.startswith(prompt):
            output = full_output[len(prompt):].strip()
        else:
            output = full_output
        
        return output, inference_time
    
    def _calculate_similarity(self, expected: str, actual: str) -> int:
        """計算相似度"""
        expected_lower = expected.lower()
        actual_lower = actual.lower()
        
        score = 0
        
        for vuln_type, keywords in self.VULNERABILITY_TYPES.items():
            if any(keyword.lower() in expected_lower for keyword in keywords):
                if any(keyword.lower() in actual_lower for keyword in keywords):
                    score = 70
                    
                    # 額外關鍵詞加分
                    if vuln_type == 'Resource Leak':
                        bonus_keywords = ['object', '物件', 'transfer', '移交', 'destroy', '銷毀', '資源']
                    elif vuln_type == 'Arithmetic Overflow':
                        bonus_keywords = ['overflow', 'underflow', '溢位', '下溢', 'checked', '算術']
                    elif vuln_type == 'Unchecked Return':
                        bonus_keywords = ['return', '返回', 'check', '檢查', 'error', '未檢查']
                    elif vuln_type == 'Cross-Module Pollution':
                        bonus_keywords = ['module', '模組', 'global', '全局', 'shared', '跨']
                    elif vuln_type == 'Capability Leak':
                        bonus_keywords = ['capability', '權限', 'permission', 'admin', '檢查']
                    else:
                        bonus_keywords = ['safe', '安全', 'no', '無', '未發現']
                    
                    bonus = sum(10 for kw in bonus_keywords if kw.lower() in actual_lower)
                    score = min(100, score + bonus)
                    break
        
        return score
    
    def _extract_vulnerability_type(self, output: str) -> str:
        """從輸出中提取漏洞類型"""
        if '未發現' in output or '安全' in output:
            return '未發現明顯漏洞'
        elif '漏洞類型：' in output:
            return output.split('漏洞類型：')[1].split('，')[0]
        else:
            # 嘗試從關鍵詞匹配
            for vtype, keywords in self.VULNERABILITY_TYPES.items():
                if any(kw.lower() in output.lower() for kw in keywords):
                    return vtype
            return '未知'
    
    def cross_validate(self, n_folds: int = 3) -> Dict:
        """
        執行 K-fold 交叉驗證
        
        Args:
            n_folds: 折數
            
        Returns:
            交叉驗證結果
        """
        print("=" * 80)
        print(f"  🎯 {n_folds}-Fold 交叉驗證")
        print("=" * 80)
        
        # 載入完整數據集
        all_samples = self.load_dataset()
        n_samples = len(all_samples)
        fold_size = n_samples // n_folds
        
        fold_results = []
        
        for fold in range(n_folds):
            print(f"\n{'='*80}")
            print(f"  📁 Fold {fold + 1}/{n_folds}")
            print(f"{'='*80}")
            
            # 分割數據
            test_start = fold * fold_size
            test_end = test_start + fold_size if fold < n_folds - 1 else n_samples
            
            test_samples = all_samples[test_start:test_end]
            train_samples = all_samples[:test_start] + all_samples[test_end:]
            
            print(f"訓練集: {len(train_samples)} 樣本")
            print(f"測試集: {len(test_samples)} 樣本")
            
            # 訓練 (使用臨時目錄)
            temp_output = f"{self.output_dir}_fold_{fold}"
            original_output = self.output_dir
            self.output_dir = temp_output
            
            # 暫時保存訓練樣本
            temp_dataset = f"temp_fold_{fold}.jsonl"
            with open(temp_dataset, 'w', encoding='utf-8') as f:
                for sample in train_samples:
                    json.dump(sample, f, ensure_ascii=False)
                    f.write('\n')
            
            original_dataset = self.dataset_path
            self.dataset_path = temp_dataset
            
            # 訓練
            train_stats = self.train_model(num_epochs=1, batch_size=2)
            
            # 測試
            test_results = self.test_model(test_samples=test_samples)
            
            # 恢復設置
            self.output_dir = original_output
            self.dataset_path = original_dataset
            
            # 清理臨時文件
            import shutil
            if os.path.exists(temp_output):
                shutil.rmtree(temp_output)
            if os.path.exists(temp_dataset):
                os.remove(temp_dataset)
            
            fold_results.append({
                'fold': fold + 1,
                'train_stats': train_stats,
                'test_results': test_results['summary']
            })
        
        # 計算平均結果
        avg_accuracy = np.mean([r['test_results']['accuracy'] for r in fold_results])
        std_accuracy = np.std([r['test_results']['accuracy'] for r in fold_results])
        
        cv_results = {
            'n_folds': n_folds,
            'total_samples': n_samples,
            'avg_accuracy': round(avg_accuracy, 2),
            'std_accuracy': round(std_accuracy, 2),
            'fold_results': fold_results,
            'timestamp': datetime.now().isoformat()
        }
        
        print(f"\n{'='*80}")
        print(f"  🎯 交叉驗證結果")
        print(f"{'='*80}")
        print(f"平均準確率: {avg_accuracy:.1f}% ± {std_accuracy:.1f}%")
        print(f"{'='*80}")
        
        # 保存結果
        cv_path = os.path.join(self.output_dir, "cross_validation_results.json")
        with open(cv_path, 'w', encoding='utf-8') as f:
            json.dump(cv_results, f, ensure_ascii=False, indent=2)
        
        print(f"✅ 交叉驗證結果已保存到: {cv_path}")
        
        return cv_results


# 便捷函數
def train_vulnerability_detection_model(
    base_model: str = "mistralai/Mistral-7B-Instruct-v0.2",
    dataset_path: str = "ml/contract_bug_dataset.jsonl",
    output_dir: str = "./lora_models",
    num_epochs: int = 3
) -> Dict:
    """
    訓練漏洞檢測模型的便捷函數
    
    Args:
        base_model: 基礎模型名稱
        dataset_path: 數據集路徑
        output_dir: 輸出目錄
        num_epochs: 訓練輪數
        
    Returns:
        訓練統計結果
    """
    service = MLTrainingService(base_model, dataset_path, output_dir)
    return service.train_model(num_epochs=num_epochs)


def test_vulnerability_detection_model(
    model_path: str = "./lora_models",
    dataset_path: str = "ml/contract_bug_dataset.jsonl"
) -> Dict:
    """
    測試漏洞檢測模型的便捷函數
    
    Args:
        model_path: 模型路徑
        dataset_path: 測試數據集路徑
        
    Returns:
        測試結果
    """
    service = MLTrainingService(dataset_path=dataset_path, output_dir=model_path)
    return service.test_model()
