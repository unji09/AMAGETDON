package com.amagetdon.stock.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "sector")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Sector {

    @Id
    @Column(length = 10)
    private String sectorCode;

    @Column(length = 100, nullable = false)
    private String sectorName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SectorLevel sectorLevel;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_code")
    private Sector parent;

    @OneToMany(mappedBy = "parent")
    private List<Sector> children = new ArrayList<>();

    @Column(nullable = false)
    private LocalDateTime createdAt;
}