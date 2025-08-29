package com.SenaiCommunity.BackEnd.Repository;

import com.SenaiCommunity.BackEnd.Entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
<<<<<<< HEAD

import java.util.Optional;

=======
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
>>>>>>> back
public interface RoleRepository extends JpaRepository<Role, Long> {
    boolean existsByNome(String nome);
    Optional<Role> findByNome(String nome);
}
