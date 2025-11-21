# 🌟 Sistema de Geração de Cards Instagram - MADETECH

> **Gerador automático de cards profissionais com IA e design espetacular**

---

## 📋 Visão Geral

Sistema completo para gerar cards profissionais para Instagram (1080x1920px) usando:
- 🤖 **Google Generative AI** (Gemini 2.0 Flash)
- 🎨 **Design Premium** com identidade visual Madetech
- ⚡ **Processamento automático** de imagens

---

## 🚀 Início Rápido

### 1️⃣ **Menu Interativo (Recomendado)**
```bash
python menu_premium.py
```

**Opções disponíveis:**
- 1️⃣ Card Simples (rápido e limpo)
- 2️⃣ Card PREMIUM (design espetacular) ⭐
- 3️⃣ Ver relatório visual
- 4️⃣ Ver cards gerados
- 5️⃣ Sair

### 2️⃣ **Teste Comparativo**
```bash
python teste_comparativo.py
```
Gera 1 card simples + 1 card premium do mesmo tema para comparar.

### 3️⃣ **Scripts Diretos**
```bash
# Card Simples
python madetech_cards.py

# Card Premium
python premium_cards.py

# Lote (5 cards)
python gerar_lote.py
```

---

## 🎨 Design Disponível

### 📊 Card SIMPLES
- Gradiente básico em azul Madetech
- Layout limpo e profissional
- Badge no topo
- Texto centralizado
- CTA na base
- ⏱️ Rápido (2-3 segundos)

### 🌟 Card PREMIUM (NOVO!)
- **Gradiente avançado** com curva matemática
- **Formas geométricas** elegantes e translúcidas
- **Badge premium** com bordas sofisticadas
- **Seção de benefícios** com linha decorativa
- **Botão CTA grande** e atraente
- **Múltiplas camadas** visuais
- ✨ Design sofisticado (4-5 segundos)

---

## 🎯 Cores Implementadas

| Cor | Código | Uso |
|-----|--------|-----|
| 🔵 Azul Primário | `#0066cc` | Fundo principal, gradiente |
| 🔷 Azul Escuro | `#003d99` | Variações, sombras |
| 🌑 Azul Muito Escuro | `#001e5a` | Sombras profundas |
| ✨ Ouro | `#FFD700` | Badge, CTA, destaques |
| ⚪ Branco | `#ffffff` | Textos principais |
| ⚫ Cinza | `#cccccc` | Textos secundários |

---

## 📁 Estrutura de Arquivos

```
instagram-card-generator/
├── menu_premium.py          ⭐ Menu interativo completo
├── teste_comparativo.py     ⭐ Comparação simples vs premium
├── madetech_cards.py        📝 Gerador simples
├── premium_cards.py         🌟 Gerador premium (novo)
├── image_generator.py       🔧 Classe base
├── gerar_lote.py            📦 Geração em lote
├── .env                     🔑 API key (confidencial)
├── output/                  📂 Cards gerados
└── requirements.txt         📋 Dependências
```

---

## 🔧 Configuração

### Instalação

```bash
# 1. Criar ambiente virtual
python -m venv venv

# 2. Ativar ambiente
venv\Scripts\activate

# 3. Instalar dependências
pip install -r requirements.txt
```

### Configurar API Key

1. Obter chave em: [Google AI Studio](https://aistudio.google.com)
2. Criar arquivo `.env`:
```
GOOGLE_API_KEY=sua_chave_aqui
```

---

## 📊 Recursos Principais

### ✅ Geração de Conteúdo
- IA gera conteúdo único para cada tema
- Mensagens profissionais e impactantes
- Adaptadas para Madetech

### ✅ Design Automático
- Gradientes elegantes (simples + premium)
- Formas geométricas (premium apenas)
- Badges com estilo
- CTA otimizado para Instagram

### ✅ Imagens
- Formato: **PNG** 1080x1920px
- Otimizado para Instagram Stories
- Nomes automáticos com timestamp
- Salvos em `output/`

### ✅ Compatibilidade
- Google Generative AI (Gemini 2.0)
- PIL/Pillow para processamento
- Python 3.10+

---

## 💡 Dicas de Uso

### 🎯 Temas Recomendados
- "Corte de Precisão em Metal"
- "Usinagem CNC Avançada"
- "Colagem Profissional"
- "Qualidade de Produto"
- "Inovação Tecnológica"

### 🚀 Para Melhor Resultado
1. Use temas descritivos e específicos
2. Teste card simples primeiro (mais rápido)
3. Depois gere premium para comparar
4. Escolha o que mais combina com sua marca

### 📱 Para Instagram
- Todos os cards estão prontos para Stories
- Tamanho exato: 1080x1920px
- Compartilhe diretamente da pasta `output/`

---

## 📈 Estatísticas

**Cards Gerados Nesta Sessão:**
- ✅ Cards Simples: 4
- ✅ Cards Premium: 6
- ✅ Total: 10+

**Tempo Médio:**
- Simples: ~2-3 segundos
- Premium: ~4-5 segundos
- Lote (5 cards): ~15-20 segundos

**Tamanho Médio:**
- Simples: 48-55 KB
- Premium: 55-65 KB

---

## 🐛 Troubleshooting

### ❌ Erro: "GOOGLE_API_KEY not found"
**Solução:** Criar arquivo `.env` com sua chave API

### ❌ Erro: "ImportError: No module named 'PIL'"
**Solução:** `pip install Pillow`

### ❌ Cards não aparecem em output/
**Solução:** Criar pasta `output/` manualmente

### ❌ "ModelNotFoundError: gemini-pro"
**Solução:** Modelo usa gemini-2.0-flash (já configurado)

---

## 📚 Classes Principais

### `MadetechCardGenerator`
Gera cards simples com design Madetech.
```python
gerador = MadetechCardGenerator()
gerador.gerar_card_madetech("Seu Tema", "Categoria")
```

### `MadetechPremiumCardGenerator`
Gera cards premium com design sofisticado.
```python
gerador = MadetechPremiumCardGenerator()
gerador.gerar_card_premium("Seu Tema")
```

---

## 🎓 Recursos Adicionais

- 📖 `RELATORIO_IDENTIDADE_VISUAL.md` - Análise completa da marca
- 📊 `ANALISE_CUSTO_DESENVOLVIMENTO.md` - Análise técnica
- 🚀 `PROJETO_FINAL.md` - Documentação do projeto
- 💰 `PROPOSTA_PRECIFICACAO_CRM.md` - Proposta comercial

---

## 👤 Autor

**Madetech Marketing**  
Sistema de Geração de Cards Instagram  
v2.0 - Premium Design Edition

---

## ⚖️ Licença

Este projeto é propriedade da Madetech.  
Todos os direitos reservados.

---

## 📞 Suporte

Para dúvidas ou sugestões, entre em contato com a equipe Madetech.

---

**Última atualização:** Dezembro 2024  
**Status:** ✅ Operacional e Testado  
**Versão:** 2.0 Premium
