package com.SenaiCommunity.BackEnd.Repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ConviteRepository extends JpaRepository<ConviteRepository, Long> {
}
