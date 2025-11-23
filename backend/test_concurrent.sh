#!/bin/bash
echo "========================================="
echo "   測試並發 ML 請求（最大並發=2）"
echo "========================================="
echo ""
echo "📊 當前記憶體狀態:"
free -h | head -2
echo ""

# 創建測試數據
cat > test1.json << 'EOF'
{"source_code": "module test::example1 { public fun safe_function(): u64 { 42 } }"}
EOF

cat > test2.json << 'EOF'
{"source_code": "module test::example2 { public fun another_safe(): u64 { 100 } }"}
EOF

cat > test3.json << 'EOF'
{"source_code": "module test::example3 { public fun third_test(): u64 { 200 } }"}
EOF

echo "🚀 發送 3 個並發請求..."
echo "  • 請求 1 & 2 應該立即執行（並發=2）"
echo "  • 請求 3 應該排隊等待"
echo ""

# 並發發送 3 個請求
(time curl -s -X POST http://localhost:8080/api/real-time-analyze -H "Content-Type: application/json" -d @test1.json > result1.json) &
PID1=$!
(time curl -s -X POST http://localhost:8080/api/real-time-analyze -H "Content-Type: application/json" -d @test2.json > result2.json) &
PID2=$!
(time curl -s -X POST http://localhost:8080/api/real-time-analyze -H "Content-Type: application/json" -d @test3.json > result3.json) &
PID3=$!

echo "請求已發送，PID: $PID1, $PID2, $PID3"
echo "等待所有請求完成..."
echo ""

wait $PID1 $PID2 $PID3

echo "✅ 所有請求完成！"
echo ""
echo "📊 最終記憶體狀態:"
free -h | head -2
echo ""
