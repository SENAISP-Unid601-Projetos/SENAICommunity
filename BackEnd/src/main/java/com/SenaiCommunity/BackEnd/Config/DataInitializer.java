package com.SenaiCommunity.BackEnd.Config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) throws Exception {
        // ID 4: SUPERVISOR
        inserirRoleSeNaoExistir(4L, "SUPERVISOR");
    }

    private void inserirRoleSeNaoExistir(Long id, String nome) {
        String sqlCheck = "SELECT count(*) FROM tb_roles WHERE role_id = ?";
        Integer count = jdbcTemplate.queryForObject(sqlCheck, Integer.class, id);

        if (count != null && count == 0) {
            String sqlInsert = "INSERT INTO tb_roles (role_id, nome) VALUES (?, ?)";
            jdbcTemplate.update(sqlInsert, id, nome);
            System.out.println("✅ Role criada automaticamente: " + nome + " (ID: " + id + ")");
        }
    }
}