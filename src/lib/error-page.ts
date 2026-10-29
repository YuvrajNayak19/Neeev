export function renderErrorPage(): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>This page didn't load</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body { font: 15px/1.5 'JetBrains Mono', ui-monospace, monospace; background: #BDEDFD; color: #1E3A8A; display: grid; place-items: center; min-height: 100vh; margin: 0; padding: 1.5rem; }
      .card { max-width: 28rem; width: 100%; text-align: center; padding: 2rem; background: rgba(255, 255, 255, 0.01); backdrop-filter: blur(2px); border-radius: 16px; box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1); }
      h1 { font-size: 1.25rem; font-weight: 500; margin: 0 0 0.5rem; color: #1E3A8A; }
      p { color: rgba(30, 58, 138, 0.7); margin: 0 0 1.5rem; }
      .actions { display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap; }
      a, button { padding: 0.5rem 1rem; border-radius: 8px; font: inherit; cursor: pointer; text-decoration: none; border: 1px solid transparent; }
      .primary { background: #1E3A8A; color: #FFFFFF; }
      .secondary { background: rgba(255, 255, 255, 0.6); color: #1E3A8A; }
    </style>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;700&display=swap" />
  </head>
  <body>
    <div class="card">
      <h1>This page didn't load</h1>
      <p>Something went wrong on our end. You can try refreshing or head back home.</p>
      <div class="actions">
        <button class="primary" onclick="location.reload()">Try again</button>
        <a class="secondary" href="/">Go home</a>
      </div>
    </div>
  </body>
</html>`;
}
