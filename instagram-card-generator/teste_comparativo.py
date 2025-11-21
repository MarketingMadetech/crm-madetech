#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
🚀 TESTE RÁPIDO - COMPARAÇÃO SIMPLES vs PREMIUM
Gera um card simples e um premium lado a lado
"""

from madetech_cards import MadetechCardGenerator
from premium_cards import MadetechPremiumCardGenerator

def teste_comparativo():
    print("\n" + "="*70)
    print("🚀 TESTE COMPARATIVO: SIMPLES vs PREMIUM")
    print("="*70)
    
    tema = "Corte de Precisão em Metal"
    
    # Gerar simples
    print(f"\n📝 Tema: {tema}")
    print("\n1️⃣  Gerando CARD SIMPLES...")
    gerador_simples = MadetechCardGenerator()
    gerador_simples.gerar_card_madetech(tema, "Geral")
    print("✅ Card simples gerado!")
    
    # Gerar premium
    print("\n2️⃣  Gerando CARD PREMIUM...")
    gerador_premium = MadetechPremiumCardGenerator()
    gerador_premium.gerar_card_premium(tema)
    print("✅ Card premium gerado!")
    
    print("\n" + "="*70)
    print("✨ COMPARAÇÃO CONCLUÍDA")
    print("="*70)
    print("\n📊 Diferenças:")
    print("  SIMPLES      → Rápido, limpo, básico")
    print("  PREMIUM      → Design sofisticado, gradientes avançados")
    print("\n📁 Ambos os cards foram salvos em: output/")

if __name__ == "__main__":
    teste_comparativo()
