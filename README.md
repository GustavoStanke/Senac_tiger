# 🎰 SENAC Tiger - Roleta Cassino  

Um mini-jogo de roleta estilo cassino desenvolvido em **HTML, CSS e JavaScript**, com sistema de apostas, probabilidades dinâmicas e histórico de jogadas.  

## 🚀 Funcionalidades  

- 🎡 **Roleta interativa** com animação e resultado visual.  
- 💰 **Gerenciamento de saldo** com depósito e saque (simulado).  
- 🎲 **Sistema de probabilidade dinâmica**:  
  - Início favorável ao jogador (60% de chance de vitória).  
  - Após 4 rodadas, probabilidade passa a favorecer a casa (25% vitória / 75% derrota).  
  - Reset automático após 15 derrotas consecutivas.  
- 🧾 **Histórico de apostas** persistente (armazenado em `localStorage`).  
- 🔊 **Efeitos sonoros** para giro, vitória e derrota.  
- 🌗 **Suporte a tema claro/escuro**.  
- 📊 **Informações de probabilidade em tempo real**.  

## 📂 Estrutura do Projeto  

```
.
├── index.html       # Estrutura principal do jogo
├── public/
│   ├── styles.css   # Estilização (tema cassino dourado e preto)
│   └── app.js       # Lógica do jogo e integração com a UI
```

## 🖥️ Tecnologias Utilizadas  

- **HTML5** para a estrutura.  
- **CSS3** (com variáveis e gradientes para tema luxo cassino).  
- **JavaScript** para lógica de jogo, manipulação do DOM e animações.  
- **localStorage** para persistência de saldo e histórico.  
- **Font Awesome** para ícones.  

## 📦 Instalação e Uso  

1. Clone este repositório:  
   ```bash
   git clone https://github.com/seu-usuario/senac-tiger-roleta.git
   cd senac-tiger-roleta
   ```

2. Abra o arquivo `index.html` diretamente no navegador **ou** sirva o projeto com um servidor local:  
   ```bash
   npx serve
   ```
   Depois acesse `http://localhost:3000`

3. Comece a jogar!  

## 🎮 Como Jogar  

1. Clique em **Depositar** e adicione créditos à sua conta.  
2. Defina o valor da aposta manualmente ou use os **botões rápidos**.  
3. Clique em **PLAY** para girar a roleta.  
4. Veja o resultado no painel central e acompanhe seu **histórico de apostas**.  
5. Caso queira, faça um **Saque** para reduzir seu saldo.  

## 🔧 Configurações  

- 🎲 Ajuste as probabilidades em `app.js` no objeto `PROBABILITY_CONFIG`.  
- 🎨 Altere o tema e cores em `styles.css` usando variáveis CSS.  
- 🔊 Sons podem ser modificados na seção `<audio>` do `index.html`.  

## 📝 Licença  

Este projeto é apenas para fins **educacionais** (SENAC) e não deve ser usado para jogos de azar reais.  
