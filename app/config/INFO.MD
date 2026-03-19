firebase.tsfirebase-admin.tsRoda emNavegador (client)Servidor (Node.js)Usado em'use client'Server Components, Route HandlersPara queLogin, interações do usuárioVerificar tokens, acessar Firestore com privilégio totalPacotefirebasefirebase-admin
São dois SDKs completamente diferentes da Google — não dá para unificar em um só arquivo. Todo projeto Next.js + Firebase vai ter essa estrutura:
app/config/
├── firebase.ts ← client SDK (navegador)
└── firebase-admin.ts ← admin SDK (servidor)
