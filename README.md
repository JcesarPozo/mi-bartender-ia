# 🍹 Mi Bartender IA

Asistente de coctelería con inteligencia artificial. Sugiere cócteles, genera imágenes de las bebidas y guarda tus recetas favoritas.

## Tecnologías

- **Framework:** Next.js 16 (App Router) + TypeScript
- **IA:** OpenRouter, Google Generative AI, Groq
- **Base de datos:** Supabase
- **Imágenes:** Pollinations AI
- **Estilos:** Tailwind CSS v4 + Framer Motion
- **Deploy:** Vercel

## Desarrollo local

### Requisitos
- Node.js 18+
- pnpm 9+

### Instalación

```bash
pnpm install
```

### Variables de entorno

Copia el archivo de ejemplo y rellena tus claves:

```bash
cp .env.example .env.local
```

Variables necesarias:

```
OPENROUTER_API_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

### Ejecutar en desarrollo

```bash
pnpm dev
```

Abre [http://localhost:3000](http://localhost:3000) en el navegador.

## Deploy

El proyecto está configurado para desplegarse automáticamente en [Vercel](https://vercel.com) al hacer push a `main`.
