# 🎨 Instagram Card Generator com Google AI Studio

**Um programa completo para gerar cards de Instagram (1080x1920) usando inteligência artificial do Google!**

---

## ✨ Funcionalidades

✅ **Geração Automática de Conteúdo** - Usa Google Gemini 2.0 para criar títulos e subtítulos inteligentes  
✅ **Design Visual Dinâmico** - Cria fundos com gradientes e elementos visuais automáticos  
✅ **Dimensões Perfeitas** - 1080x1920px (exato do Instagram Stories/Reels)  
✅ **Modo Interativo** - Menu fácil para usar sem programação  
✅ **Geração em Lote** - Cria vários cards de uma vez  
✅ **API Google Generative** - Integrada e funcionando

---

## 🚀 Como Usar

### 1️⃣ **Ativar Ambiente Virtual**
```powershell
cd "c:\Users\madet\OneDrive\Desktop\Marketing Madetech\Planilhas CRM\CRM MArketing\instagram-card-generator"
venv\Scripts\activate
```

### 2️⃣ **Opção A: Modo Interativo** (Recomendado)
```powershell
python main_interativo.py
```

**Menu com opções:**
- 1️⃣ Gerar 1 card personalizado
- 2️⃣ Gerar múltiplos cards em lote
- 3️⃣ Ver cards gerados
- 4️⃣ Sair

### 3️⃣ **Opção B: Gerador em Lote**
```powershell
python gerar_lote.py
```

Gera 5 cards automaticamente com temas pré-definidos.

### 4️⃣ **Opção C: Script Personalizado**
```python
from image_generator import InstagramCardGenerator

gerador = InstagramCardGenerator()
gerador.gerar_card_completo("Seu Tema Aqui")
```

---

## 📁 Estrutura do Projeto

```
instagram-card-generator/
├── image_generator.py      # ⭐ Classe principal de geração
├── main_interativo.py      # 🎮 Menu interativo
├── gerar_lote.py          # 📊 Gerador em lote
├── config.py              # ⚙️ Configurações
├── requirements.txt       # 📦 Dependências
├── .env                   # 🔐 API Key (privado)
├── venv/                  # 🐍 Ambiente Python
└── output/                # 📸 Cards gerados
    ├── marketing_digital_*.png
    ├── e-commerce_*.png
    └── ...
```

---

## 🔧 O que cada arquivo faz

### `image_generator.py` ⭐
**Classe principal que:**
- Gera conteúdo com Google Gemini 2.0 Flash
- Cria design visual com gradientes
- Adiciona texto com fontes profissionais
- Salva cards em PNG 1080x1920

### `main_interativo.py` 🎮
**Menu interativo com:**
- Geração de 1 card
- Geração de múltiplos cards
- Visualização de cards gerados
- Interface amigável

### `gerar_lote.py` 📊
**Script automático que:**
- Gera 5 cards de uma vez
- Usa temas pré-definidos
- Sem interação necessária

---

## 🤖 Modelos IA Disponíveis

### Atual: `gemini-2.0-flash`
- ⚡ Rápido
- 💰 Barato
- 📝 Bom para textos

---

## 📞 Links Úteis

- 🌐 [Google AI Studio](https://ai.google.dev/)
- 📚 [Google Generative AI Python](https://pypi.org/project/google-generativeai/)
- 🖼️ [Pillow Documentation](https://pillow.readthedocs.io/)

---

## 📅 Info do Projeto

- **Criado em:** 12 de Novembro de 2025
- **Versão:** 2.0 (Com geração de imagens)
- **Status:** ✅ Funcional e Testado
