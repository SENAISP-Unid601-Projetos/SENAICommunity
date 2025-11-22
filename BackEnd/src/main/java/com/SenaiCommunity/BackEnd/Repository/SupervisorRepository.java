package com.SenaiCommunity.BackEnd.Repository;

import com.SenaiCommunity.BackEnd.Entity.Supervisor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SupervisorRepository extends JpaRepository<Supervisor, Long> {
    // O JpaRepository já contém os métodos save(), findById(), etc.
}