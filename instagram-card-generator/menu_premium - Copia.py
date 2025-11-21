#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
🎨 MENU PREMIUM - GERADOR DE CARDS MADETECH
Escolha entre versão simples ou PREMIUM espetacular
"""

from madetech_cards import MadetechCardGenerator
from premium_cards import MadetechPremiumCardGenerator
import os

def menu_principal():
    print("\n" + "="*70)
    print("🌟 GERADOR DE CARDS INSTAGRAM - MADETECH PREMIUM")
    print("="*70)
    print("\n📱 ESCOLHA O TIPO DE CARD:\n")
    print("1️⃣  Simples (Rápido e limpo)")
    print("2️⃣  🌟 PREMIUM (Design espetacular)")
    print("\n🔧 FERRAMENTAS:\n")
    print("3️⃣  Ver relatório visual")
    print("4️⃣  Ver cards gerados")
    print("5️⃣  Sair")
    print("\n" + "="*70)
    return input("👉 Escolha uma opção (1-5): ").strip()

def gerar_card_simples():
    """Gera card simples"""
    print("\n" + "-"*70)
    print("📝 CARD SIMPLES")
    print("-"*70)
    
    gerador = MadetechCardGenerator()
    
    tema = input("\n📌 Digite o tema: ").strip()
    
    if tema:
        try:
            gerador.gerar_card_madetech(tema, "Geral")
            print(f"✅ Card simples gerado!")
        except Exception as e:
            print(f"❌ Erro: {e}")
    else:
        print("❌ Tema inválido!")

def gerar_card_premium():
    """Gera card premium"""
    print("\n" + "-"*70)
    print("🌟 CARD PREMIUM (Design Espetacular)")
    print("-"*70)
    
    gerador = MadetechPremiumCardGenerator()
    
    tema = input("\n📌 Digite o tema: ").strip()
    
    if tema:
        try:
            gerador.gerar_card_premium(tema)
            print(f"✅ Card PREMIUM gerado com design espetacular!")
        except Exception as e:
            print(f"❌ Erro: {e}")
    else:
        print("❌ Tema inválido!")

def ver_cards():
    """Mostra cards gerados"""
    output_dir = "output"
    
    if not os.path.exists(output_dir):
        print("❌ Pasta output não encontrada!")
        return
    
    arquivos = sorted([f for f in os.listdir(output_dir) if f.endswith('.png')], reverse=True)
    
    if not arquivos:
        print("❌ Nenhum card gerado!")
        return
    
    print("\n" + "="*70)
    print(f"📁 CARDS GERADOS ({len(arquivos)})")
    print("="*70 + "\n")
    
    # Separa por tipo
    premium = [f for f in arquivos if 'premium_' in f]
    madetech = [f for f in arquivos if 'madetech_' in f and 'premium_' not in f]
    outros = [f for f in arquivos if 'premium_' not in f and 'madetech_' not in f]
    
    if premium:
        print("🌟 CARDS PREMIUM:\n")
        for i, arquivo in enumerate(premium, 1):
            tamanho = os.path.getsize(os.path.join(output_dir, arquivo)) / 1024
            print(f"{i:2d}. {arquivo:55s} ({tamanho:6.1f} KB) ⭐")
    
    if madetech:
        print("\n🎨 CARDS MADETECH:\n")
        for i, arquivo in enumerate(madetech, 1):
            tamanho = os.path.getsize(os.path.join(output_dir, arquivo)) / 1024
            print(f"{i:2d}. {arquivo:55s} ({tamanho:6.1f} KB)")
    
    if outros:
        print("\n📊 OUTROS CARDS:\n")
        for i, arquivo in enumerate(outros, 1):
            tamanho = os.path.getsize(os.path.join(output_dir, arquivo)) / 1024
            print(f"{i:2d}. {arquivo:55s} ({tamanho:6.1f} KB)")

def ver_relatorio():
    """Mostra relatório"""
    print("\n" + "="*70)
    print("📊 RELATÓRIO DE IDENTIDADE VISUAL MADETECH")
    print("="*70)
    print("\n✅ Cores Implementadas:")
    print("  🔵 Azul Primário: #0066cc")
    print("  🔷 Azul Escuro: #003d99")
    print("  ✨ Ouro: #FFD700")
    print("  ⚪ Branco: #ffffff")
    print("\n✅ Designs Disponíveis:")
    print("  📝 Simples: Layout básico e limpo")
    print("  🌟 Premium: Design sofisticado com múltiplas camadas")
    print("\n✅ Características Premium:")
    print("  • Gradientes complexos")
    print("  • Formas geométricas elegantes")
    print("  • Badges premium com bordas")
    print("  • Seção de benefícios destacada")
    print("  • CTA em botão grande e atraente")
    print("  • Linhas decorativas profissionais")

def main():
    while True:
        try:
            opcao = menu_principal()
            
            if opcao == "1":
                gerar_card_simples()
            elif opcao == "2":
                gerar_card_premium()
            elif opcao == "3":
                ver_relatorio()
            elif opcao == "4":
                ver_cards()
            elif opcao == "5":
                print("\n👋 Até logo!\n")
                break
            else:
                print("❌ Opção inválida!")
                
        except KeyboardInterrupt:
            print("\n\n👋 Programa interrompido!")
            break
        except Exception as e:
            print(f"❌ Erro: {e}")

if __name__ == "__main__":
    main()
