# 🌻 Flores Amarillas

Una web animada con un ramo de flores amarillas que crece en pantalla, un mensaje escrito a máquina y un contador de tiempo. Un detalle bonito para regalar. 💛

## Cómo usarlo

Abre `index.html` en el navegador. También puedes levantar un servidor local:

```bash
python3 -m http.server 8000
```

Y entra a `http://localhost:8000`.

## Personalización

También puedes abrir [`editar.html`](./editar.html) para cambiar el nombre, el mensaje y la fecha del temporizador desde una pestaña separada. Los cambios se guardan en el navegador y se sincronizan al recargar el árbol.

Puedes cambiar el nombre y la fecha directamente en la URL, sin tocar el código:

```text
https://yellow-flowers-url.vercel.app/index.html?nombre=Eduarda&fecha=2026-04-13
```

- **nombre**: a quién van dedicadas las flores.
- **fecha**: desde cuándo empieza a contar el tiempo.

El árbol añade ramas según los meses transcurridos desde la fecha elegida y el mensaje permanece orientado a una historia que sigue floreciendo.

Para más ajustes (imágenes, tamaño, mensaje), edita `assets/js/config.js` y el bloque `#code` de `index.html`.

## Estructura

```text
index.html                 Página principal
favicon.png                Icono de la pestaña
assets/
  css/styles.css           Estilos
  js/
    config.js              Configuración (nombre, fecha, imágenes, animación)
    main.js                Punto de entrada: orquesta la secuencia de animaciones
    tree-engine.js         Motor de dibujo del árbol y las flores (canvas)
    ui/
      clock.js             Contador de tiempo
      interactions.js      Click / teclado para iniciar
      typewriter.js        Efecto de máquina de escribir
  images/flower-1..7.avif  Flores usadas en la animación
tools/
  optimize_images.py       Utilidad para reconvertir imágenes a AVIF
```

Sin dependencias externas: solo HTML, CSS y JavaScript nativo.
