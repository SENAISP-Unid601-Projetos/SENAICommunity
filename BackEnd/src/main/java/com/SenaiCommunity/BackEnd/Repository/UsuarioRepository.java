package com.SenaiCommunity.BackEnd.Repository;


import com.SenaiCommunity.BackEnd.Entity.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    Optional<Usuario> findByEmail(String email);

    // Busca usuários aonde o nome tenha o termo de pesquisa (ignorando maiúsculas/minúsculas)
    List<Usuario> findByNomeContainingIgnoreCaseAndIdNot(String nome, Long id);

}
