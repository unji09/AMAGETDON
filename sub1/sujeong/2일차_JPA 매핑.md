**1. 엔티티 매핑(Entity Mapping)**
<Br>
엔티티 매핑은 자바 객체를 데이터베이스 테이블과 연결하는 과정으로,
JPA에서 객체 중심 설계를 가능하게 하는 기본 단계이다.

```java
@Entity
public class Member {

    @Id
    private Long id;

    private String name;
}
```

@Entity : JPA가 관리하는 엔티티 클래스

@Id : 기본 키(PK) 매핑

@Table, @Column은 생략 시 관례에 따라 자동 매핑


**2. 기본 키(PK) 매핑 핵심**
<br>

```java
@Id
@GeneratedValue
private Long id;
```

대리 키(Long) 사용 권장

키 값은 비즈니스 의미와 분리

자동 생성 전략을 통해 DB 의존성 최소화


**3. 연관관계 매핑이 필요한 이유**
<Br>
객체는 참조(reference) 로 관계를 표현

테이블은 외래 키(FK) 로 관계를 표현
→ 이 차이를 해결하기 위해 연관관계 매핑이 필요하다.


**4. 단방향 연관관계 (N:1)**
<br>

```java
@Entity
public class Member {

    @ManyToOne
    @JoinColumn(name = "TEAM_ID")
    private Team team;
}
```

외래 키를 직접 다루지 않고 객체를 참조

객체 그래프 탐색 가능

JPA 연관관계 매핑의 기본 형태


**5. 양방향 연관관계와 연관관계의 주인**
<Br>

```java
@Entity
public class Team {

    @OneToMany(mappedBy = "team")
    private List<Member> members = new ArrayList<>();
}
```

양방향 관계에서는 연관관계의 주인이 필요

외래 키가 있는 쪽이 연관관계의 주인

주인만이 FK를 관리(등록·수정)한다

👉 Member.team 이 연관관계의 주인


**6. 양방향 매핑 시 핵심 주의사항**<BR>

```java
team.getMembers().add(member);
member.setTeam(team);
```

연관관계의 주인에 값이 설정되지 않으면 DB에 반영되지 않는다

객체 상태 일관성을 위해 양쪽 모두 설정

실무에서는 단방향 매핑을 기본으로 사용하고, 필요 시 양방향 추가