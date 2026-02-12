# JPQL 핵심 요약

## 1. 객체지향 쿼리 언어 종류

### JPQL
- **엔티티 객체를 대상**으로 쿼리 (테이블 X)
- SQL을 추상화해서 특정 DB에 의존하지 않음
- 결국 SQL로 변환됨

### Criteria
- 자바 코드로 JPQL 작성
- **너무 복잡** → QueryDSL 권장

### QueryDSL
- 자바 코드로 JPQL 작성
- 컴파일 시점에 문법 오류 발견
- 동적 쿼리 작성 편리
- **실무 사용 권장**

### 네이티브 SQL
- 특정 DB에 의존적인 기능 사용 시

---

## 2. JPQL 기본 문법

### 기본 규칙
```sql
select m from Member as m where m.age > 18
```
- 엔티티 이름 사용 (테이블명 X)
- 별칭 필수 (as 생략 가능)
- 대소문자 구분: 엔티티/속성 O, 키워드 X

### 집계 함수
- `COUNT`, `SUM`, `AVG`, `MAX`, `MIN`
- `GROUP BY`, `HAVING`, `ORDER BY` 지원

### 결과 조회
- `getResultList()`: 결과 여러 개 → 리스트
- `getSingleResult()`: 결과 정확히 1개 → 단일 객체

### 프로젝션
```java
// new 명령어로 DTO 직접 조회
SELECT new jpabook.jpql.UserDTO(m.username, m.age) 
FROM Member m
```

### 페이징
```java
.setFirstResult(10)   // 시작 위치
.setMaxResults(20)    // 조회할 데이터 수
```

---

## 3. 조인

### 기본 조인
```sql
-- 내부 조인
SELECT m FROM Member m JOIN m.team t

-- 외부 조인  
SELECT m FROM Member m LEFT JOIN m.team t

-- 세타 조인
SELECT m FROM Member m, Team t WHERE m.username = t.name
```

### ON 절 (JPA 2.1+)
```sql
-- 조인 대상 필터링
SELECT m FROM Member m LEFT JOIN m.team t ON t.name = 'A'

-- 연관관계 없는 외부 조인
SELECT m FROM Member m LEFT JOIN Team t ON m.username = t.name
```

---

## 4. 서브 쿼리

### 지원 함수
- `EXISTS`: 서브쿼리에 결과 존재하면 참
- `ALL`: 모두 만족
- `ANY/SOME`: 하나라도 만족
- `IN`: 하나라도 같은 값 있으면 참

### 한계
- WHERE, HAVING 절에서만 사용 가능
- SELECT 절 가능 (하이버네이트)
- FROM 절 불가 (하이버네이트6부터 가능)

---

## 5. 페치 조인

### 개념
- JPQL 성능 최적화 기능
- 연관된 엔티티를 **SQL 한 번에 함께 조회**
- 지연 로딩 무시하고 즉시 로딩

### 엔티티 페치 조인
```sql
-- JPQL
SELECT m FROM Member m JOIN FETCH m.team

-- SQL: Team도 함께 조회
SELECT M.*, T.* FROM MEMBER M
INNER JOIN TEAM T ON M.TEAM_ID=T.ID
```

### 컬렉션 페치 조인
```sql
-- JPQL
SELECT t FROM Team t JOIN FETCH t.members

-- 일대다 조인으로 결과 중복 발생
-- 하이버네이트6부터 자동으로 중복 제거
```

### 일반 조인 vs 페치 조인
- **일반 조인**: SELECT 절의 엔티티만 조회
- **페치 조인**: 연관 엔티티도 함께 조회

### 한계
- 페치 조인 대상에 별칭 불가
- 둘 이상의 컬렉션 페치 조인 불가
- 컬렉션 페치 조인 시 페이징 불가

### 특징
- 글로벌 로딩 전략보다 우선
- **실무: 모두 지연 로딩 + 필요시 페치 조인**

---

## 6. 경로 표현식

### 용어
- **상태 필드**: 값 저장 필드 (`m.username`)
- **단일 값 연관 필드**: 엔티티 (`m.team`)
- **컬렉션 값 연관 필드**: 컬렉션 (`m.orders`)

### 특징
- **상태 필드**: 탐색 끝
- **단일 값 연관**: 묵시적 내부 조인 발생, 탐색 가능
- **컬렉션 값 연관**: 묵시적 내부 조인 발생, 탐색 불가

### 실무 조언
- **묵시적 조인 대신 명시적 조인 사용!**
- 조인은 SQL 튜닝의 핵심
- 묵시적 조인은 파악하기 어려움

---

## 7. 다형성 쿼리

### TYPE
```sql
-- Item 중 Book, Movie만 조회
SELECT i FROM Item i WHERE type(i) IN (Book, Movie)
```

### TREAT
```sql
-- 부모 타입을 자식 타입으로 다룰 때
SELECT i FROM Item i WHERE treat(i as Book).author = 'kim'
```

---

## 8. 엔티티 직접 사용

### 기본 키
```sql
-- 둘 다 같은 SQL 실행
SELECT count(m.id) FROM Member m
SELECT count(m) FROM Member m
```

### 외래 키
```sql
-- 둘 다 같은 SQL 실행
SELECT m FROM Member m WHERE m.team = :team
SELECT m FROM Member m WHERE m.team.id = :teamId
```

---

## 9. Named 쿼리

### 특징
- 미리 정의하고 이름 부여
- 정적 쿼리
- **애플리케이션 로딩 시점에 쿼리 검증**

### 사용
```java
@NamedQuery(
    name = "Member.findByUsername",
    query = "SELECT m FROM Member m WHERE m.username = :username"
)
```

---

## 10. 벌크 연산

### 개념
- 쿼리 한 번으로 여러 엔티티 수정/삭제
- `executeUpdate()` 사용

### 예제
```java
String qlString = "UPDATE Product p " +
    "SET p.price = p.price * 1.1 " +
    "WHERE p.stockAmount < :stockAmount";
    
int resultCount = em.createQuery(qlString)
    .setParameter("stockAmount", 10)
    .executeUpdate();
```

### 주의사항
- **영속성 컨텍스트를 무시하고 DB에 직접 쿼리**
- 해결: 벌크 연산 먼저 실행 → 영속성 컨텍스트 초기화
