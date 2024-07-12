import type { LocaleData } from '../locale.js';

/** Spanish locale. */
export const es: LocaleData = {
  metadata: { code: 'es', name: 'Spanish' },
  person: {
    firstNames: [
      'Alejandro', 'Ana', 'Carlos', 'Carmen', 'Diego', 'Elena', 'Isabel',
      'Javier', 'Jorge', 'José', 'Juan', 'Laura', 'Lucía', 'Manuel', 'María',
      'Marta', 'Miguel', 'Pablo', 'Pedro', 'Sofía', 'Valentina',
    ],
    lastNames: [
      'Álvarez', 'Díaz', 'Fernández', 'García', 'Gómez', 'González',
      'Hernández', 'Jiménez', 'López', 'Martín', 'Martínez', 'Moreno', 'Muñoz',
      'Pérez', 'Rodríguez', 'Romero', 'Ruiz', 'Sánchez', 'Torres',
    ],
  },
  location: {
    cities: [
      'Barcelona', 'Bilbao', 'Granada', 'Madrid', 'Málaga', 'Murcia',
      'Palma', 'Sevilla', 'Valencia', 'Zaragoza',
    ],
    countries: [
      { name: 'España', code: 'ES' },
      { name: 'México', code: 'MX' },
      { name: 'Argentina', code: 'AR' },
      { name: 'Colombia', code: 'CO' },
    ],
    streetSuffixes: ['Calle', 'Avenida', 'Paseo', 'Plaza', 'Camino'],
    zipFormat: '#####',
  },
};
