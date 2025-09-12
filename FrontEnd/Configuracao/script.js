document.addEventListener('DOMContentLoaded', () => {
    
    // Encontra o interruptor de "Conta Privada" pelo ID
    const contaPrivadaToggle = document.querySelector('#conta-privada-toggle');

    // Verifica se o elemento existe na página para evitar erros
    if (contaPrivadaToggle) {
        
        // Adiciona um "ouvinte" que espera por uma mudança (clique)
        contaPrivadaToggle.addEventListener('change', (event) => {
            
            // event.target.checked será 'true' se o botão estiver ligado, e 'false' se desligado.
            const isPrivada = event.target.checked; 

            // Exibe o status no console do navegador (F12 para ver)
            console.log(`A configuração de Conta Privada foi alterada para: ${isPrivada ? 'ATIVADA' : 'DESATIVADA'}.`);

            // --- AQUI ENTRA A LÓGICA FUTURA ---
            // No futuro, você enviará este valor (isPrivada) para o seu servidor
            // para salvar permanentemente a preferência do usuário.
            // Exemplo:
            // salvarPreferenciaPrivacidade(isPrivada);
        });
    }

});