import joblib
import numpy as np

# 모델 로드
model = joblib.load('personality_model.pkl')

# 레이블 매핑
LABEL_TO_TYPE = {
    0: "AGGRESSIVE",
    1: "STABLE",
    2: "NEUTRAL"
}

# 테스트 케이스 1: 공격형 패턴
# (거래 많음, 학습 적음)
aggressive_pattern = np.array([[
    0,  # attendance_king
    0,  # diversify_eggs
    0,  # you_are_mine
    1,  # i_pick_you ✓
    0,  # i_am_groove
    0,  # zero_balance
    0,  # broke
    0,  # billionaire
    0,  # ten_million_club
    0,  # quiz_survivor
    0,  # newbie_escape
    1,  # pharmacist ✓
    1,  # iron_man ✓
    1,  # korea_chip ✓
    1,  # open_run ✓
    1,  # buzzer_beater ✓
    1,  # half_profit ✓
    0   # crash_loss
]])

pred = model.predict(aggressive_pattern)[0]
prob = model.predict_proba(aggressive_pattern)[0]

print("=" * 50)
print("테스트 1: 공격형 패턴")
print("=" * 50)
print(f"예측 성향: {LABEL_TO_TYPE[pred]}")
print(f"신뢰도: {prob[pred]:.2%}")
print(f"확률 분포: AGGRESSIVE={prob[0]:.2%}, STABLE={prob[1]:.2%}, NEUTRAL={prob[2]:.2%}")
print()

# 테스트 케이스 2: 안정형 패턴
# (출석, 학습 많음, 거래 적음)
stable_pattern = np.array([[
    1,  # attendance_king ✓
    0,  # diversify_eggs
    0,  # you_are_mine
    0,  # i_pick_you
    1,  # i_am_groove ✓
    0,  # zero_balance
    0,  # broke
    0,  # billionaire
    0,  # ten_million_club
    1,  # quiz_survivor ✓
    1,  # newbie_escape ✓
    0,  # pharmacist
    0,  # iron_man
    0,  # korea_chip
    0,  # open_run
    0,  # buzzer_beater
    0,  # half_profit
    0   # crash_loss
]])

pred = model.predict(stable_pattern)[0]
prob = model.predict_proba(stable_pattern)[0]

print("=" * 50)
print("테스트 2: 안정형 패턴")
print("=" * 50)
print(f"예측 성향: {LABEL_TO_TYPE[pred]}")
print(f"신뢰도: {prob[pred]:.2%}")
print(f"확률 분포: AGGRESSIVE={prob[0]:.2%}, STABLE={prob[1]:.2%}, NEUTRAL={prob[2]:.2%}")
print()

# 테스트 케이스 3: 중립형 패턴
# (골고루)
neutral_pattern = np.array([[
    1,  # attendance_king ✓
    1,  # diversify_eggs ✓
    0,  # you_are_mine
    1,  # i_pick_you ✓
    1,  # i_am_groove ✓
    0,  # zero_balance
    0,  # broke
    1,  # billionaire ✓
    0,  # ten_million_club
    1,  # quiz_survivor ✓
    0,  # newbie_escape
    0,  # pharmacist
    1,  # iron_man ✓
    0,  # korea_chip
    1,  # open_run ✓
    0,  # buzzer_beater
    0,  # half_profit
    0   # crash_loss
]])

pred = model.predict(neutral_pattern)[0]
prob = model.predict_proba(neutral_pattern)[0]

print("=" * 50)
print("테스트 3: 중립형 패턴")
print("=" * 50)
print(f"예측 성향: {LABEL_TO_TYPE[pred]}")
print(f"신뢰도: {prob[pred]:.2%}")
print(f"확률 분포: AGGRESSIVE={prob[0]:.2%}, STABLE={prob[1]:.2%}, NEUTRAL={prob[2]:.2%}")
print()

# 테스트 케이스 4: 실제 사용자 시뮬레이션
# 업적 ID: 1, 4, 10, 12, 15 달성 (5개)
user_achievements = [1, 4, 10, 12, 15]
achievement_ids = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18]

feature_vector = np.zeros(18, dtype=int)
for idx, achievement_id in enumerate(achievement_ids):
    if achievement_id in user_achievements:
        feature_vector[idx] = 1

feature_vector = feature_vector.reshape(1, -1)

pred = model.predict(feature_vector)[0]
prob = model.predict_proba(feature_vector)[0]

print("=" * 50)
print("테스트 4: 실제 사용자 시뮬레이션")
print("=" * 50)
print(f"달성 업적: {user_achievements}")
print(f"특성 벡터: {feature_vector[0]}")
print(f"예측 성향: {LABEL_TO_TYPE[pred]}")
print(f"신뢰도: {prob[pred]:.2%}")
print(f"확률 분포: AGGRESSIVE={prob[0]:.2%}, STABLE={prob[1]:.2%}, NEUTRAL={prob[2]:.2%}")
print()

print("✅ 모든 테스트 완료!")