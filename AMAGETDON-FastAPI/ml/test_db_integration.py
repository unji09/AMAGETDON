import pymysql
import numpy as np
import joblib

# DB 연결 설정 (본인 환경에 맞게 수정)
DB_CONFIG = {
    'host': 'localhost',
    'port': 3306,
    'user': 'root',
    'password': 'your_password',  # 실제 비밀번호로 변경
    'database': 'amagetdon',
    'charset': 'utf8mb4'
}

# 모델 로드
model = joblib.load('personality_model.pkl')

LABEL_TO_TYPE = {
    0: "AGGRESSIVE",
    1: "STABLE",
    2: "NEUTRAL"
}

ACHIEVEMENT_IDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18]

def get_user_achievements(user_id):
    """사용자 달성 업적 조회"""
    connection = pymysql.connect(**DB_CONFIG)
    try:
        with connection.cursor() as cursor:
            sql = """
                SELECT achievement_id
                FROM user_achievements
                WHERE user_id = %s AND is_achieved = 1
            """
            cursor.execute(sql, (user_id,))
            result = cursor.fetchall()
            achievement_ids = [row[0] for row in result]
            return achievement_ids
    finally:
        connection.close()

def build_feature_vector(achieved_ids):
    """업적 → 특성 벡터 변환"""
    feature_vector = np.zeros(18, dtype=int)
    for idx, achievement_id in enumerate(ACHIEVEMENT_IDS):
        if achievement_id in achieved_ids:
            feature_vector[idx] = 1
    return feature_vector.reshape(1, -1)

def analyze_personality(user_id):
    """성향 분석"""
    # 업적 조회
    achievements = get_user_achievements(user_id)
    achievement_count = len(achievements)

    print(f"사용자 ID: {user_id}")
    print(f"달성 업적 개수: {achievement_count}")
    print(f"달성 업적 ID: {achievements}")
    print()

    # 최소 개수 체크
    if achievement_count < 5:
        print(f"❌ 분석 불가: 최소 5개 이상의 업적이 필요합니다")
        return

    # 특성 벡터 생성
    features = build_feature_vector(achievements)

    # 예측
    pred = model.predict(features)[0]
    prob = model.predict_proba(features)[0]

    predicted_type = LABEL_TO_TYPE[pred]
    confidence = prob[pred]

    print("=" * 50)
    print("📊 성향 분석 결과")
    print("=" * 50)
    print(f"예측 성향: {predicted_type}")
    print(f"신뢰도: {confidence:.2%}")
    print(f"확률 분포:")
    print(f"  - AGGRESSIVE: {prob[0]:.2%}")
    print(f"  - STABLE: {prob[1]:.2%}")
    print(f"  - NEUTRAL: {prob[2]:.2%}")

if __name__ == "__main__":
    # 테스트할 사용자 ID (본인 환경에 맞게 수정)
    test_user_id = 1

    try:
        analyze_personality(test_user_id)
    except pymysql.Error as e:
        print(f"❌ DB 연결 오류: {e}")
        print("\n💡 DB 설정을 확인하세요:")
        print("  - host, port, user, password, database")