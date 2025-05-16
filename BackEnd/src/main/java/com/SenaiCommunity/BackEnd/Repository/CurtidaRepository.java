package com.SenaiCommunity.BackEnd.Repository;

import com.SenaiCommunity.BackEnd.Entity.Curtida;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CurtidaRepository extends JpaRepository<Curtida, Long> {
}
