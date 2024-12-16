from flask import Flask, jsonify, request
from flask_cors import CORS
import numpy as np
from datetime import datetime
import uuid
import json

app = Flask(__name__)
CORS(app)

# 用字典模拟数据库存储
predictions_db = {}
history_db = {}

def predict_compatibility(data):
    factors = {
        'age_difference': 0.2,
        'common_interests': 0.3,
        'communication': 0.3,
        'values_alignment': 0.2
    }
    
    score = 0
    for key, weight in factors.items():
        if key in data:
            score += data[key] * weight
    
    random_factor = np.random.normal(0, 0.1)
    final_score = min(max(score + random_factor, 0), 1) * 100
    
    return round(final_score, 2)

@app.route('/api/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()
        
        # 基本的输入验证
        required_fields = ['age_difference', 'common_interests', 
                         'communication', 'values_alignment']
        
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'status': 'error',
                    'message': f'Missing required field: {field}'
                }), 400
        
        # 计算匹配度
        compatibility_score = predict_compatibility(data)
        
        # 生成预测结果
        analysis = {
            'score': compatibility_score,
            'level': 'High' if compatibility_score >= 75 else 
                    'Medium' if compatibility_score >= 50 else 'Low',
            'details': {
                'age_compatibility': '年龄差异适中' if data['age_difference'] >= 0.5 else '年龄差异较大',
                'interests': '共同兴趣很多' if data['common_interests'] >= 0.7 else '兴趣相对独立',
                'communication_quality': '沟通良好' if data['communication'] >= 0.6 else '需要加强沟通',
                'values': '价值观契合' if data['values_alignment'] >= 0.7 else '价值观有所差异'
            }
        }
        
        # 生成唯一ID用于分享
        prediction_id = str(uuid.uuid4())
        
        # 保存预测结果
        predictions_db[prediction_id] = {
            'result': analysis,
            'timestamp': datetime.now().isoformat(),
            'inputs': data
        }
        
        # 添加到历史记录
        if 'user_id' in data:
            user_id = data['user_id']
            if user_id not in history_db:
                history_db[user_id] = []
            history_db[user_id].append({
                'id': prediction_id,
                'result': analysis,
                'timestamp': datetime.now().isoformat()
            })
            # 只保留最近5条记录
            history_db[user_id] = history_db[user_id][-5:]
        
        return jsonify({
            'status': 'success',
            'data': analysis,
            'prediction_id': prediction_id
        })
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/predictions/<prediction_id>', methods=['GET'])
def get_prediction(prediction_id):
    if prediction_id in predictions_db:
        return jsonify({
            'status': 'success',
            'data': predictions_db[prediction_id]
        })
    return jsonify({
        'status': 'error',
        'message': 'Prediction not found'
    }), 404

@app.route('/api/history/<user_id>', methods=['GET'])
def get_history(user_id):
    if user_id in history_db:
        return jsonify({
            'status': 'success',
            'data': history_db[user_id]
        })
    return jsonify({
        'status': 'success',
        'data': []
    })

@app.route('/api/test', methods=['GET'])
def test():
    return jsonify({
        'status': 'success',
        'message': 'Flask后端服务器运行正常！'
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)