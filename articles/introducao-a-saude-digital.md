---
title: Introdução a Saúde Digital
difficulty: iniciante
author: Kayque da Silva Melo
date: 2026-05-03
tags: saúde digital, sistemas
---

## Por que aprender Rust?

Rust é uma linguagem de programação de sistemas que prioriza **segurança**, **velocidade** e **concorrência**. Se você vem do Python, vai notar diferenças fundamentais na forma como a memória é gerenciada.

## O Sistema de Ownership

O conceito mais importante de Rust é o *ownership*. Cada valor em Rust tem um único dono, e quando esse dono sai do escopo, o valor é dropado automaticamente.

```rust
fn main() {
    let s1 = String::from("olá");
    let s2 = s1; // s1 é movido para s2
    // println!("{}", s1); // Isso causaria um erro!
    println!("{}", s2);
}
```

## Borrowing e Referências

Em vez de transferir ownership, você pode *emprestar* referências:

```rust
fn calcular_tamanho(s: &String) -> usize {
    s.len()
}

fn main() {
    let s1 = String::from("mundo");
    let len = calcular_tamanho(&s1);
    println!("'{}' tem {} caracteres", s1, len);
}
```

## Conclusão

Rust tem uma curva de aprendizado íngreme, mas os benefícios em performance e segurança de memória valem o investimento. Comece pelos projetos pequenos e evolua gradualmente.
