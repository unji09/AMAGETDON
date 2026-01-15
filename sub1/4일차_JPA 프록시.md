1. 프록시 사용의 목적과 기준
언제 프록시를 쓰는가
Member member = em.getReference(Member.class, id);


지금 당장 데이터가 필요 없을 때

연관 엔티티 조회를 뒤로 미루고 싶을 때

성능 최적화를 위해 불필요한 SELECT 방지

핵심 특징

- 실제 엔티티를 상속한 객체
- 사용 시점에 DB 조회
- 초기화 이후에도 프록시는 프록시 상태 유지
- 타입 비교 시 == ❌ → instanceof 사용

⚠️ 주의

em.close();
member.getName(); // LazyInitializationException


→ 프록시는 영속성 컨텍스트 안에서만 안전


2. 실무 로딩 전략 원칙 (가장 중요)
❌ 즉시 로딩(EAGER) 기본 사용 금지
@ManyToOne(fetch = FetchType.EAGER) // 기본값

✅ 실무 표준: 전부 지연 로딩(LAZY)
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "TEAM_ID")
private Team team;

@OneToOne(fetch = FetchType.LAZY)



3. 실제 조회 최적화는 fetch join으로 해결
select m from Member m
join fetch m.team


연관 엔티티를 한 번의 SQL로 조회

LAZY 설정 유지 + 필요한 경우만 즉시 조회

EAGER를 대체하는 실무 해결책

👉 결론

“연관관계는 LAZY, 조회는 fetch join”



4. 영속성 전이(CASCADE) 실무 사용 기준
사용 가능한 경우
@OneToMany(mappedBy = "order", cascade = CascadeType.ALL)
private List<OrderItem> orderItems;


부모가 자식의 생명주기를 전적으로 관리

자식이 부모 없이 의미 없음

단일 Aggregate 내부 관계

사용하면 안 되는 경우

- 여러 엔티티가 자식을 공유
- 참조 관계가 복잡한 경우

📌 CASCADE는 연관관계가 아니라 “편의 기능”

5. 고아 객체 제거(orphanRemoval)
@OneToMany(
    mappedBy = "parent",
    orphanRemoval = true
)
private List<Child> children;


컬렉션에서 제거 → DB에서도 DELETE

참조가 하나일 때만 사용

개인 소유 엔티티에 적합

⚠️ 주의

parent.getChildren().remove(child);
// 즉시 DELETE 발생

6. CASCADE + orphanRemoval = 생명주기 완전 위임
@OneToMany(
    mappedBy = "parent",
    cascade = CascadeType.ALL,
    orphanRemoval = true
)


부모만 persist / remove 하면 됨

자식은 직접 em.persist(), em.remove() ❌

DDD Aggregate Root 패턴 구현