# ТКГ — Three.js Assignment

## Текущее состояние

Реализована **Часть 1** задания.

## Запуск

```bash
npm install
npm run dev
```

Открыть:
- `http://localhost:5173/`
- `http://localhost:5173/parts-1-3.html`

## Выполнено в части 1

- Сцена с `OrbitControls`.
- Включены тени (`renderer.shadowMap`, источники света с `castShadow`).
- В сцене 4+ объектов.
- Используется текстурированный меш (куб с `public/textures/checker.svg`).
- Добавлено 3+ источника света, минимум 2 типа (`Ambient`, `Directional`, `Point`, `Hemisphere`).
- 2 объекта созданы на `BufferGeometry` (плоскость и треугольная пирамида).
- Есть HTML-управление 3+ параметрами (интенсивности/цвета света, цвет объекта).
