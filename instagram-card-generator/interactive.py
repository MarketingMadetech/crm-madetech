#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Script Interativo para Gerar Cards Instagram
"""

from main import InstagramCardGenerator
from datetime import datetime
import os

def interactive_mode():
    """Modo interativo para gerar cards personalizados"""
    
    print("\n" + "=" * 60)
    print("📱 Gerador Interativo de Cards Instagram")
    print("=" * 60)
    
    while True:
        print("\n📋 Opções:")
        print("1️⃣  Gerar card com texto personalizado")
        print("2️⃣  Gerar card com conteúdo gerado por IA")
        print("3️⃣  Gerar múltiplos cards")
        print("4️⃣  Ver cards gerados")
        print("5️⃣  Sair")
        
        choice = input("\n👉 Escolha uma opção (1-5): ").strip()
        
        if choice == "1":
            generate_custom_card()
        elif choice == "2":
            generate_ai_card()
        elif choice == "3":
            generate_batch()
        elif choice == "4":
            view_output()
        elif choice == "5":
            print("\n👋 Até logo!")
            break
        else:
            print("❌ Opção inválida!")


def generate_custom_card():
    """Gera card com texto personalizado"""
    print("\n" + "-" * 60)
    print("✏️ Criar Card Personalizado")
    print("-" * 60)
    
    title = input("📝 Digite o título: ").strip()
    subtitle = input("📝 Digite o subtítulo (opcional): ").strip()
    
    themes = ["dark", "light", "gradient"]
    print("\nTemas disponíveis:")
    for i, theme in enumerate(themes, 1):
        print(f"{i}. {theme}")
    
    theme_choice = input("Escolha o tema (1-3) [padrão: dark]: ").strip()
    theme = themes[int(theme_choice) - 1] if theme_choice in ["1", "2", "3"] else "dark"
    
    if not title:
        print("❌ Título é obrigatório!")
        return
    
    generator = InstagramCardGenerator(theme=theme)
    img = generator.create_card(title=title, subtitle=subtitle)
    generator.save_card(img, f"custom_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png")


def generate_ai_card():
    """Gera card com conteúdo da IA"""
    print("\n" + "-" * 60)
    print("🤖 Card com Conteúdo IA")
    print("-" * 60)
    
    prompt = input("📝 Descreva o que quer gerar: ").strip()
    
    if not prompt:
        print("❌ Prompt é obrigatório!")
        return
    
    generator = InstagramCardGenerator(theme="dark")
    
    print("\n⏳ Gerando conteúdo com IA...")
    content = generator.generate_content(prompt)
    
    if content:
        lines = content.strip().split('\n')
        title = lines[0][:60]
        subtitle = lines[1] if len(lines) > 1 else ""
        
        print(f"✅ Título: {title}")
        
        img = generator.create_card(title=title, subtitle=subtitle)
        generator.save_card(img, f"ai_generated_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png")
    else:
        print("❌ Erro ao gerar conteúdo")


def generate_batch():
    """Gera múltiplos cards com prompts diferentes"""
    print("\n" + "-" * 60)
    print("📊 Gerador em Lote")
    print("-" * 60)
    
    num_cards = input("Quantos cards deseja gerar? (1-10): ").strip()
    
    try:
        num_cards = int(num_cards)
        if num_cards < 1 or num_cards > 10:
            print("❌ Digite um número entre 1 e 10")
            return
    except ValueError:
        print("❌ Entrada inválida")
        return
    
    generator = InstagramCardGenerator(theme="dark")
    
    prompts = [
        "Crie um título impactante para marketing digital em uma única linha",
        "Escreva um título motivacional sobre crescimento empresarial",
        "Gere um título para um card sobre produtividade",
        "Crie um título sobre inovação tecnológica",
        "Escreva um título para vendas e empreendedorismo",
        "Gere um título sobre liderança",
        "Crie um título para um card de consultoria",
        "Escreva um título motivacional para redes sociais",
        "Gere um título sobre transformação digital",
        "Crie um título para estratégia empresarial",
    ]
    
    print(f"\n⏳ Gerando {num_cards} cards...")
    
    for i in range(num_cards):
        try:
            content = generator.generate_content(prompts[i % len(prompts)])
            if content:
                title = content.strip().split('\n')[0][:60]
                subtitle = f"Card {i+1}"
                
                img = generator.create_card(title=title, subtitle=subtitle)
                generator.save_card(img, f"batch_{i+1:02d}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png")
                
                print(f"✅ Card {i+1}/{num_cards}: {title[:40]}...")
        except Exception as e:
            print(f"❌ Erro ao gerar card {i+1}: {e}")


def view_output():
    """Mostra os cards gerados"""
    print("\n" + "-" * 60)
    print("📁 Cards Gerados")
    print("-" * 60)
    
    output_dir = "output"
    
    if not os.path.exists(output_dir):
        print("❌ Pasta 'output' não encontrada")
        return
    
    files = [f for f in os.listdir(output_dir) if f.endswith('.png')]
    
    if not files:
        print("❌ Nenhum card gerado ainda")
        return
    
    files.sort(reverse=True)
    
    print(f"\n📊 Total de {len(files)} cards gerados:\n")
    for i, file in enumerate(files[:10], 1):
        file_path = os.path.join(output_dir, file)
        size = os.path.getsize(file_path) / 1024  # em KB
        print(f"{i:2d}. {file:40s} ({size:6.1f} KB)")
    
    if len(files) > 10:
        print(f"\n... e mais {len(files) - 10} cards")
    
    print(f"\n📂 Localização: {os.path.abspath(output_dir)}")


if __name__ == "__main__":
    try:
        interactive_mode()
    except KeyboardInterrupt:
        print("\n\n👋 Programa interrompido!")
    except Exception as e:
        print(f"\n❌ Erro: {e}")
