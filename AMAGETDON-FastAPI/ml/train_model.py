import pandas as pd
import numpy as np
from xgboost import XGBClassifier
import joblib
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix

# 데이터 로드
print("📂 데이터 로딩 중...")
df = pd.read_csv('./synthetic_achievement_data.csv')

print(f"✅ 데이터 로드 완료: {len(df)}명")
print(f"   - AGGRESSIVE (0): {(df['label'] == 0).sum()}명")
print(f"   - STABLE (1): {(df['label'] == 1).sum()}명")
print(f"   - NEUTRAL (2): {(df['label'] == 2).sum()}명")
print()

# 특성(X)과 레이블(y) 분리
feature_columns = [
    'attendance_king', 'diversify_eggs', 'you_are_mine', 'i_pick_you',
    'i_am_groove', 'zero_balance', 'broke', 'billionaire', 'ten_million_club',
    'quiz_survivor', 'newbie_escape', 'pharmacist', 'iron_man', 'korea_chip',
    'open_run', 'buzzer_beater', 'half_profit', 'crash_loss'
]

X = df[feature_columns].values
y = df['label'].values

# 학습/테스트 데이터 분리 (80% 학습, 20% 테스트)
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

print(f"📊 데이터 분리 완료")
print(f"   - 학습 데이터: {len(X_train)}명")
print(f"   - 테스트 데이터: {len(X_test)}명")
print()

# XGBoost 모델 학습 (정규화 강화)
print("🤖 XGBoost 모델 학습 중...")
model = XGBClassifier(
    n_estimators=50,           # 100 → 50 (트리 개수 감소)
    max_depth=3,               # 5 → 3 (깊이 제한)
    learning_rate=0.05,        # 0.1 → 0.05 (학습률 감소)
    min_child_weight=3,        # 최소 가중치 (분할 제한)
    gamma=0.1,                 # 분할 최소 손실 감소
    subsample=0.8,             # 샘플 80%만 사용
    colsample_bytree=0.8,      # 특성 80%만 사용
    reg_alpha=0.1,             # L1 정규화
    reg_lambda=1.0,            # L2 정규화
    objective='multi:softmax', # 다중 클래스 분류
    num_class=3,               # 3개 클래스 (AGGRESSIVE, STABLE, NEUTRAL)
    random_state=42,
    eval_metric='mlogloss'     # 평가 지표
)

# Cross Validation (5-Fold)
print("📊 Cross Validation 수행 중...")
cv_scores = cross_val_score(model, X_train, y_train, cv=5, scoring='accuracy')
print(f"✅ Cross Validation 완료!")
print(f"   - CV 정확도: {cv_scores.mean():.4f} (+/- {cv_scores.std():.4f})")
print(f"   - Fold별 점수: {[f'{score:.4f}' for score in cv_scores]}")
print()

# 전체 학습 데이터로 최종 학습
print("🎯 최종 모델 학습 중...")
model.fit(X_train, y_train)
print("✅ 학습 완료!")
print()

# 모델 평가
print("📈 모델 성능 평가")
print("-" * 50)

# 학습 데이터 정확도
train_pred = model.predict(X_train)
train_accuracy = accuracy_score(y_train, train_pred)
print(f"학습 데이터 정확도: {train_accuracy:.4f} ({train_accuracy*100:.2f}%)")

# 테스트 데이터 정확도
test_pred = model.predict(X_test)
test_accuracy = accuracy_score(y_test, test_pred)
print(f"테스트 데이터 정확도: {test_accuracy:.4f} ({test_accuracy*100:.2f}%)")
print()

# 클래스별 성능
print("📊 클래스별 성능 (테스트 데이터)")
print("-" * 50)
target_names = ['AGGRESSIVE', 'STABLE', 'NEUTRAL']
print(classification_report(y_test, test_pred, target_names=target_names))

# 혼동 행렬
print("🔢 혼동 행렬 (Confusion Matrix)")
print("-" * 50)
cm = confusion_matrix(y_test, test_pred)
print(f"{'':15} {'AGGRESSIVE':>12} {'STABLE':>12} {'NEUTRAL':>12}")
for i, label in enumerate(target_names):
    print(f"{label:15} {cm[i][0]:>12} {cm[i][1]:>12} {cm[i][2]:>12}")
print()

# 특성 중요도
print("🎯 특성 중요도 (Feature Importance)")
print("-" * 50)
feature_importance = model.feature_importances_
feature_importance_df = pd.DataFrame({
    'feature': feature_columns,
    'importance': feature_importance
}).sort_values('importance', ascending=False)

for idx, row in feature_importance_df.head(10).iterrows():
    print(f"{row['feature']:20} {row['importance']:.4f}")
print()

# 모델 저장
output_path = './personality_model.pkl'
joblib.dump(model, output_path)
print(f"💾 모델 저장 완료: {output_path}")
print()

# 예측 예시
print("🧪 예측 테스트")
print("-" * 50)
# 공격형 패턴 (거래 많음, 학습 적음)
sample_aggressive = np.array([[0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0]])
pred_aggressive = model.predict(sample_aggressive)[0]
prob_aggressive = model.predict_proba(sample_aggressive)[0]
print(f"공격형 패턴 예측: {target_names[pred_aggressive]} (신뢰도: {prob_aggressive[pred_aggressive]:.2f})")

# 안정형 패턴 (출석, 학습 많음, 거래 적음)
sample_stable = np.array([[1, 0, 0, 0, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0]])
pred_stable = model.predict(sample_stable)[0]
prob_stable = model.predict_proba(sample_stable)[0]
print(f"안정형 패턴 예측: {target_names[pred_stable]} (신뢰도: {prob_stable[pred_stable]:.2f})")

# 중립형 패턴 (골고루)
sample_neutral = np.array([[1, 1, 0, 1, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 0, 0]])
pred_neutral = model.predict(sample_neutral)[0]
prob_neutral = model.predict_proba(sample_neutral)[0]
print(f"중립형 패턴 예측: {target_names[pred_neutral]} (신뢰도: {prob_neutral[pred_neutral]:.2f})")
print()

print("=" * 50)
print("✅ 모든 작업 완료!")
print("=" * 50)