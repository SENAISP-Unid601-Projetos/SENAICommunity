package com.SenaiCommunity.BackEnd.Repository;

import com.SenaiCommunity.BackEnd.Entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RoleRepository extends JpaRepository<Role, Long> {
    boolean existsByNome(String nome);
    Optional<Role> findByNome(String nome);
}
