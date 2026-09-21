(function () {
    'use strict';

    const STORAGE_KEYS = {
        users: 'mathware_users',
        session: 'mathware_session',
        records: 'mathware_history',
        sessionToken: 'mathware_session_token'
    };

    const DIFFICULTY_SETTINGS = {
        facil: { label: 'Fácil', secondsPerQuestion: 18, multiplier: 1 },
        normal: { label: 'Normal', secondsPerQuestion: 24, multiplier: 1.15 },
        complejo: { label: 'Complejo', secondsPerQuestion: 30, multiplier: 1.35 },
        dificil: { label: 'Difícil', secondsPerQuestion: 38, multiplier: 1.6 },
        imposible: { label: 'Imposible', secondsPerQuestion: 46, multiplier: 1.9 }
    };

    const SUBJECT_TEMPLATES = {
        matematica: [
            function (difficulty, topic) {
                const x = randomInt(2, 12);
                const y = randomInt(2, 18);
                const z = randomInt(3, 9);
                const correct = x * z + y;
                const question = topic ? `En el tema de ${topic}, resuelve la ecuación ${x}a + ${y} = ${correct}. ¿Cuál es el valor de a?` : `Resuelve la ecuación ${x}a + ${y} = ${correct}. ¿Cuál es el valor de a?`;
                return { question, options: shuffleOptions([x, x + 1, z, correct]) };
            },
            function (difficulty, topic) {
                const base = randomInt(10, 95);
                const percent = randomInt(5, 40);
                const correct = Math.round((base * percent) / 100);
                const question = topic ? `En ${topic}, ¿cuánto es ${percent}% de ${base}?` : `¿Cuánto es ${percent}% de ${base}?`;
                return { question, options: shuffleOptions([correct, correct + 5, correct - 7, correct + 12]) };
            },
            function (difficulty, topic) {
                const lado = randomInt(3, 12);
                const correct = lado * 4;
                const question = topic ? `En ${topic}, calcula el perímetro de un cuadrado cuyo lado mide ${lado} cm.` : `Calcula el perímetro de un cuadrado cuyo lado mide ${lado} cm.`;
                return { question, options: shuffleOptions([correct, correct + 3, correct + 8, correct - 4]) };
            }
        ],
        fisica: [
            function (difficulty, topic) {
                const v = randomInt(10, 90);
                const t = randomInt(2, 20);
                const correct = v * t;
                const question = topic ? `En ${topic}, un móvil recorre ${v} m/s durante ${t} s. ¿Cuál es la distancia recorrida?` : `Un móvil recorre ${v} m/s durante ${t} s. ¿Cuál es la distancia recorrida?`;
                return { question, options: shuffleOptions([correct, correct + 12, correct - 18, correct + 32]) };
            },
            function (difficulty, topic) {
                const masa = randomInt(5, 30);
                const aceleracion = randomInt(2, 12);
                const correct = masa * aceleracion;
                const question = topic ? `En ${topic}, calcula la fuerza resultante con masa ${masa} kg y aceleración ${aceleracion} m/s².` : `Calcula la fuerza resultante con masa ${masa} kg y aceleración ${aceleracion} m/s².`;
                return { question, options: shuffleOptions([correct, correct + 7, correct + 18, correct - 10]) };
            },
            function (difficulty, topic) {
                const potencia = randomInt(50, 250);
                const tiempo = randomInt(2, 15);
                const correct = potencia * tiempo;
                const question = topic ? `En ${topic}, si una máquina consume ${potencia} W durante ${tiempo} s, ¿cuál es el trabajo realizado?` : `Si una máquina consume ${potencia} W durante ${tiempo} s, ¿cuál es el trabajo realizado?`;
                return { question, options: shuffleOptions([correct, correct + 25, correct - 14, correct + 50]) };
            }
        ],
        quimica: [
            function (difficulty, topic) {
                const ph = randomInt(1, 14);
                const correct = ph;
                const question = topic ? `En ${topic}, el pH de una solución es ${ph}. ¿Cuál es el valor numérico del pH?` : `El pH de una solución es ${ph}. ¿Cuál es el valor numérico del pH?`;
                return { question, options: shuffleOptions([correct, correct + 2, correct + 6, correct - 3]) };
            },
            function (difficulty, topic) {
                const mol = randomInt(2, 12);
                const masa = randomInt(20, 100);
                const correct = Math.round(masa / mol);
                const question = topic ? `En ${topic}, si ${masa} g de una sustancia se distribuyen en ${mol} moles, ¿cuál es la masa molar aproximada?` : `Si ${masa} g de una sustancia se distribuyen en ${mol} moles, ¿cuál es la masa molar aproximada?`;
                return { question, options: shuffleOptions([correct, correct + 5, correct - 3, correct + 10]) };
            }
        ],
        biologia: [
            function (difficulty, topic) {
                const correct = 'Mitocondria';
                const question = topic ? `En ${topic}, ¿qué organelo es conocido como la central energética de la célula?` : '¿Qué organelo es conocido como la central energética de la célula?';
                return { question, options: shuffleOptions(['Mitocondria', 'Núcleo', 'Membrana', 'Ribosoma']) };
            },
            function (difficulty, topic) {
                const correct = 'Fotosíntesis';
                const question = topic ? `En ${topic}, ¿qué proceso permite a las plantas convertir energía solar en energía química?` : '¿Qué proceso permite a las plantas convertir energía solar en energía química?';
                return { question, options: shuffleOptions(['Fotosíntesis', 'Respiración', 'Digestión', 'Fermentación']) };
            }
        ],
        sociales: [
            function (difficulty, topic) {
                const correct = 'Constitución';
                const question = topic ? `En ${topic}, ¿qué documento establece las normas fundamentales de un Estado?` : '¿Qué documento establece las normas fundamentales de un Estado?';
                return { question, options: shuffleOptions(['Constitución', 'Contrato', 'Ley orgánica', 'Acta']) };
            },
            function (difficulty, topic) {
                const correct = 'Democracia';
                const question = topic ? `En ${topic}, ¿qué sistema político reconoce el poder del pueblo?` : '¿Qué sistema político reconoce el poder del pueblo?';
                return { question, options: shuffleOptions(['Democracia', 'Monarquía', 'Autocracia', 'Feudalismo']) };
            }
        ],
        geometria: [
            function (difficulty, topic) {
                const lado = randomInt(4, 15);
                const correct = lado * lado;
                const question = topic ? `En ${topic}, ¿cuál es el área de un cuadrado cuyo lado mide ${lado} cm?` : `¿Cuál es el área de un cuadrado cuyo lado mide ${lado} cm?`;
                return { question, options: shuffleOptions([correct, correct + 8, correct + 18, correct - 6]) };
            },
            function (difficulty, topic) {
                const radio = randomInt(3, 12);
                const correct = Math.PI * radio * radio;
                const question = topic ? `En ${topic}, ¿cuál es el área aproximada de un círculo de radio ${radio} cm?` : `¿Cuál es el área aproximada de un círculo de radio ${radio} cm?`;
                return { question, options: shuffleOptions([Math.round(correct), Math.round(correct) + 12, Math.round(correct) - 9, Math.round(correct) + 20]) };
            }
        ],
        informatica: [
            function (difficulty, topic) {
                const correct = 'HTML';
                const question = topic ? `En ${topic}, ¿qué lenguaje se usa principalmente para estructurar páginas web?` : '¿Qué lenguaje se usa principalmente para estructurar páginas web?';
                return { question, options: shuffleOptions(['HTML', 'SQL', 'CSS', 'JSON']) };
            },
            function (difficulty, topic) {
                const correct = 'CPU';
                const question = topic ? `En ${topic}, ¿qué componente se encarga del procesamiento de datos en una computadora?` : '¿Qué componente se encarga del procesamiento de datos en una computadora?';
                return { question, options: shuffleOptions(['CPU', 'RAM', 'Monitor', 'Teclado']) };
            }
        ],
        ingles: [
            function (difficulty, topic) {
                const correct = 'Book';
                const question = topic ? `En ${topic}, ¿cómo se dice "libro" en inglés?` : '¿Cómo se dice "libro" en inglés?';
                return { question, options: shuffleOptions(['Book', 'Table', 'Water', 'Door']) };
            },
            function (difficulty, topic) {
                const correct = 'Teacher';
                const question = topic ? `En ${topic}, ¿cómo se dice "profesor" en inglés?` : '¿Cómo se dice "profesor" en inglés?';
                return { question, options: shuffleOptions(['Teacher', 'Student', 'School', 'Chair']) };
            }
        ],
        estadistica: [
            function (difficulty, topic) {
                const correct = 'Media';
                const question = topic ? `En ${topic}, ¿cómo se llama el promedio de un conjunto de datos?` : '¿Cómo se llama el promedio de un conjunto de datos?';
                return { question, options: shuffleOptions(['Media', 'Moda', 'Rango', 'Mediana']) };
            },
            function (difficulty, topic) {
                const correct = 'Mediana';
                const question = topic ? `En ${topic}, ¿qué medida estadística representa el valor central en un conjunto ordenado?` : '¿Qué medida estadística representa el valor central en un conjunto ordenado?';
                return { question, options: shuffleOptions(['Mediana', 'Varianza', 'Moda', 'Desviación']) };
            }
        ],
        lenguaje: [
            function (difficulty, topic) {
                const correct = 'Sinónimo';
                const question = topic ? `En ${topic}, ¿cómo se llama la palabra que tiene un significado parecido a otra?` : '¿Cómo se llama la palabra que tiene un significado parecido a otra?';
                return { question, options: shuffleOptions(['Sinónimo', 'Antónimo', 'Homónimo', 'Pronombre']) };
            },
            function (difficulty, topic) {
                const correct = 'Artículo';
                const question = topic ? `En ${topic}, ¿qué clase de palabra acompaña al sustantivo y puede ser definido o indefinido?` : '¿Qué clase de palabra acompaña al sustantivo y puede ser definido o indefinido?';
                return { question, options: shuffleOptions(['Artículo', 'Verbo', 'Adverbio', 'Preposición']) };
            }
        ],
        'lectura critica': [
            function (difficulty, topic) {
                const correct = 'Analizar';
                const question = topic ? `En ${topic}, ¿qué acción implica interpretar y evaluar críticamente un texto?` : '¿Qué acción implica interpretar y evaluar críticamente un texto?';
                return { question, options: shuffleOptions(['Analizar', 'Memorizar', 'Copiar', 'Etiquetar']) };
            },
            function (difficulty, topic) {
                const correct = 'Idea principal';
                const question = topic ? `En ${topic}, ¿qué elemento del texto resume la intención central del autor?` : '¿Qué elemento del texto resume la intención central del autor?';
                return { question, options: shuffleOptions(['Idea principal', 'Detalle superficial', 'Título vacío', 'Conclusión improvisada']) };
            }
        ],
        filosofia: [
            function (difficulty, topic) {
                const correct = 'Racional';
                const question = topic ? `En ${topic}, ¿qué tipo de conocimiento busca explicar la realidad mediante la razón?` : '¿Qué tipo de conocimiento busca explicar la realidad mediante la razón?';
                return { question, options: shuffleOptions(['Racional', 'Empírico', 'Instintivo', 'Visual']) };
            },
            function (difficulty, topic) {
                const correct = 'Verdad';
                const question = topic ? `En ${topic}, ¿qué concepto filosófico se refiere a la correspondencia entre lo pensado y la realidad?` : '¿Qué concepto filosófico se refiere a la correspondencia entre lo pensado y la realidad?';
                return { question, options: shuffleOptions(['Verdad', 'Opinión', 'Confirmación', 'Pista']) };
            }
        ],
        'competencia ciudadana': [
            function (difficulty, topic) {
                const correct = 'Participación';
                const question = topic ? `En ${topic}, ¿qué valor se fortalece cuando una persona interviene en asuntos colectivos y democráticos?` : '¿Qué valor se fortalece cuando una persona interviene en asuntos colectivos y democráticos?';
                return { question, options: shuffleOptions(['Participación', 'Aislamiento', 'Privacidad', 'Desorden']) };
            },
            function (difficulty, topic) {
                const correct = 'Derechos';
                const question = topic ? `En ${topic}, ¿qué conjunto de garantías fundamentales deben ser respetados por todas las personas?` : '¿Qué conjunto de garantías fundamentales deben ser respetados por todas las personas?';
                return { question, options: shuffleOptions(['Derechos', 'Intereses', 'Votos', 'Costumbres']) };
            }
        ],
        'economia politica': [
            function (difficulty, topic) {
                const correct = 'Oferta';
                const question = topic ? `En ${topic}, ¿cómo se denomina la cantidad de bienes o servicios que los productores están dispuestos a vender?` : '¿Cómo se denomina la cantidad de bienes o servicios que los productores están dispuestos a vender?';
                return { question, options: shuffleOptions(['Demanda', 'Oferta', 'Costo fijo', 'Inversión']) };
            },
            function (difficulty, topic) {
                const correct = 'Inflación';
                const question = topic ? `En ${topic}, ¿qué fenómeno económico refleja el aumento sostenido de precios en una economía?` : '¿Qué fenómeno económico refleja el aumento sostenido de precios en una economía?';
                return { question, options: shuffleOptions(['Inflación', 'Deflación', 'Mercado', 'Balance']) };
            }
        ],
        'educacion fisica': [
            function (difficulty, topic) {
                const correct = 'Resistencia';
                const question = topic ? `En ${topic}, ¿qué capacidad física permite mantener esfuerzo durante más tiempo?` : '¿Qué capacidad física permite mantener esfuerzo durante más tiempo?';
                return { question, options: shuffleOptions(['Resistencia', 'Velocidad', 'Flexibilidad', 'Coordinación']) };
            },
            function (difficulty, topic) {
                const correct = 'Calentamiento';
                const question = topic ? `En ${topic}, ¿qué etapa del ejercicio prepara el cuerpo antes de la actividad intensa?` : '¿Qué etapa del ejercicio prepara el cuerpo antes de la actividad intensa?';
                return { question, options: shuffleOptions(['Calentamiento', 'Recuperación', 'Reposo', 'Competencia']) };
            }
        ]
    };

    const API_BASE = (typeof window !== 'undefined' && window.location && window.location.origin)
        ? `${window.location.origin}/api`
        : 'http://localhost:3000/api';
    const ADMIN_USERNAME = 'Diego Buitrago';

    const AuthSystem = {
        async register(username, password) {
            const cleanUser = String(username || '').trim();
            if (cleanUser.length < 3) {
                return { success: false, message: 'El usuario debe tener al menos 3 caracteres.' };
            }
            if (!/^[a-zA-Z0-9_]+$/.test(cleanUser)) {
                return { success: false, message: 'El usuario solo puede contener letras, números y guion bajo.' };
            }
            if (String(password || '').length < 4) {
                return { success: false, message: 'La contraseña debe tener al menos 4 caracteres.' };
            }

            try {
                const response = await fetch(`${API_BASE}/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: cleanUser, password })
                });
                const result = await response.json();
                if (!response.ok) {
                    return { success: false, message: result.message || 'No se pudo registrar.' };
                }
                return { success: true, message: result.message };
            } catch (error) {
                return { success: false, message: 'No se pudo conectar con el servidor.' };
            }
        },

        async login(username, password) {
            const cleanUser = String(username || '').trim();
            try {
                const response = await fetch(`${API_BASE}/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: cleanUser, password })
                });
                const result = await response.json();
                if (!response.ok) {
                    return { success: false, message: result.message || 'Usuario o contraseña incorrectos.' };
                }
                localStorage.setItem(STORAGE_KEYS.session, cleanUser);
                localStorage.setItem(STORAGE_KEYS.sessionToken, result.sessionToken || '');
                localStorage.setItem('mathware_role', result.role || 'user');
                return { success: true, user: cleanUser, role: result.role || 'user' };
            } catch (error) {
                return { success: false, message: 'No se pudo conectar con el servidor.' };
            }
        },

        logout() {
            localStorage.removeItem(STORAGE_KEYS.session);
            localStorage.removeItem(STORAGE_KEYS.sessionToken);
            localStorage.removeItem('mathware_role');
        },

        getSession() {
            return localStorage.getItem(STORAGE_KEYS.session);
        },

        getRole() {
            return localStorage.getItem('mathware_role') || 'user';
        },

        getSessionToken() {
            return localStorage.getItem(STORAGE_KEYS.sessionToken) || '';
        },

        isLoggedIn() {
            return Boolean(this.getSession() && this.getSessionToken());
        },

        isOwner() {
            return this.isLoggedIn() && this.getSession() === ADMIN_USERNAME;
        },

        isAdmin() {
            return this.isOwner() || this.getRole() === 'admin';
        }
    };

    const HistoryStore = {
        async load() {
            const username = AuthSystem.getSession();
            try {
                const query = new URLSearchParams();
                if (username) query.set('username', username);
                query.set('_', String(Date.now()));
                const response = await fetch(`${API_BASE}/history?${query.toString()}`, {
                    cache: 'no-store',
                    headers: { 'x-session-token': AuthSystem.getSessionToken() }
                });
                const result = await response.json();
                if (!response.ok) return [];
                return Array.isArray(result.history) ? result.history : [];
            } catch (error) {
                return [];
            }
        },

        async getGlobalSummary() {
            try {
                const response = await fetch(`${API_BASE}/stats?_=${Date.now()}`, { cache: 'no-store' });
                const result = await response.json();
                if (!response.ok) {
                    return { total: 0, average: '0.0', top: [] };
                }
                return {
                    total: Number(result.total || 0),
                    average: String(result.average || '0.0'),
                    top: Array.isArray(result.top) ? result.top : []
                };
            } catch (error) {
                return { total: 0, average: '0.0', top: [] };
            }
        },

        async saveResult(record) {
            try {
                const response = await fetch(`${API_BASE}/history`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'x-session-token': AuthSystem.getSessionToken() },
                    body: JSON.stringify(record)
                });
                return response.ok;
            } catch (error) {
                return false;
            }
        },

        async clear() {
            try {
                const response = await fetch(`${API_BASE}/history`, {
                    method: 'DELETE',
                    headers: { 'x-session-token': AuthSystem.getSessionToken() }
                });
                const result = await response.json();
                return response.ok && Boolean(result.success);
            } catch (error) {
                return false;
            }
        }
    };

    let currentExam = {
        subject: 'matematicas',
        topic: '',
        difficulty: 'normal',
        count: 10,
        questions: [],
        currentIndex: 0,
        score: 0,
        startedAt: 0,
        timeLimit: 0,
        timerId: null,
        timeRemaining: 0
    };

    function randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function shuffleOptions(options) {
        const arr = [...options];
        for (let i = arr.length - 1; i > 0; i -= 1) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    function makeSalt() {
        return Array.from({ length: 16 }, () => Math.random().toString(16).slice(2, 3)).join('');
    }

    function hashPassword(password, salt) {
        let hash = 0;
        for (let i = 0; i < password.length; i += 1) {
            hash = (hash * 31 + password.charCodeAt(i) + salt.charCodeAt(i % salt.length).charCodeAt(0)) >>> 0;
        }
        return hash.toString(16);
    }

    function showToast(message) {
        const toast = document.getElementById('toast');
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add('show');
        clearTimeout(showToast.timer);
        showToast.timer = setTimeout(() => toast.classList.remove('show'), 2200);
    }

    function escapeHtml(value) {
        return String(value ?? '').replace(/[&<>'"]/g, (character) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[character]));
    }

    function showView(viewId) {
        const views = document.querySelectorAll('.view');
        views.forEach((view) => view.classList.remove('active'));
        const target = document.getElementById(viewId);
        if (target) {
            target.classList.add('active');
        }
    }

    const SIMULATION_DEFINITIONS = {
        mru: { category: 'Cinemática', fields: [['velocity', 'Velocidad', 20, 'm/s'], ['time', 'Tiempo', 5, 's']], calculate: ({ velocity, time }) => ({ title: 'Movimiento rectilíneo uniforme', formula: 'x = v · t', values: `x = ${velocity} · ${time}`, result: `Distancia: ${(velocity * time).toFixed(2)} m`, path: 'line' }) },
        circular: { category: 'Cinemática', fields: [['radius', 'Radio', 3, 'm'], ['angularVelocity', 'Velocidad angular', 2, 'rad/s'], ['time', 'Tiempo', 5, 's']], calculate: ({ radius, angularVelocity, time }) => ({ title: 'Movimiento circular', formula: 'θ = ω · t', values: `θ = ${angularVelocity} · ${time}`, result: `Ángulo: ${(angularVelocity * time).toFixed(2)} rad · Velocidad lineal: ${(radius * angularVelocity).toFixed(2)} m/s · Período: ${(2 * Math.PI / Math.max(0.01, Math.abs(angularVelocity))).toFixed(2)} s`, path: 'circle' }) },
        vertical: { category: 'Cinemática', fields: [['initialHeight', 'Altura inicial', 20, 'm'], ['initialVelocity', 'Velocidad inicial', 0, 'm/s'], ['time', 'Tiempo', 2, 's']], calculate: ({ initialHeight, initialVelocity, time, gravity }) => ({ title: 'Movimiento vertical', formula: 'y = y₀ + v₀t − ½gt²', values: `y = ${initialHeight} + ${initialVelocity}(${time}) − ½(${gravity})(${time})²`, result: `Altura: ${Math.max(0, initialHeight + initialVelocity * time - 0.5 * gravity * time * time).toFixed(2)} m`, path: 'vertical' }) },
        launch: { category: 'Cinemática', fields: [['initialVelocity', 'Velocidad de lanzamiento', 18, 'm/s']], calculate: ({ initialVelocity, gravity }) => ({ title: 'Lanzamiento vertical', formula: 'hₘₐₓ = v₀² / 2g', values: `hₘₐₓ = ${initialVelocity}² / (2 · ${gravity})`, result: `Altura máxima: ${(initialVelocity * initialVelocity / (2 * gravity)).toFixed(2)} m · Tiempo total: ${(2 * initialVelocity / gravity).toFixed(2)} s`, path: 'vertical' }) },
        freefall: { category: 'Cinemática', fields: [['height', 'Altura', 30, 'm'], ['time', 'Tiempo', 2, 's']], calculate: ({ height, time, gravity }) => { const impactTime = Math.sqrt(2 * height / gravity); const effectiveTime = Math.min(time, impactTime); return { title: 'Caída libre', formula: 'v = gt', values: `v = ${gravity} · ${effectiveTime.toFixed(2)}`, result: `Velocidad: ${(gravity * effectiveTime).toFixed(2)} m/s · Distancia: ${(0.5 * gravity * effectiveTime * effectiveTime).toFixed(2)} m · Tiempo de impacto: ${impactTime.toFixed(2)} s`, path: 'fall' }; } },
        parabolic: { category: 'Cinemática', fields: [['initialVelocity', 'Velocidad inicial', 20, 'm/s'], ['angle', 'Ángulo', 45, '°']], calculate: ({ initialVelocity, angle, gravity }) => { const radians = angle * Math.PI / 180; return { title: 'Movimiento parabólico', formula: 'R = v₀² sin(2θ) / g', values: `R = ${initialVelocity}² · sin(2 · ${angle}°) / ${gravity}`, result: `Alcance: ${(initialVelocity * initialVelocity * Math.sin(2 * radians) / gravity).toFixed(2)} m · Altura máxima: ${(initialVelocity * initialVelocity * Math.sin(radians) ** 2 / (2 * gravity)).toFixed(2)} m`, path: 'parabola' }; } },
        semiparabolic: { category: 'Cinemática', fields: [['height', 'Altura', 20, 'm'], ['horizontalVelocity', 'Velocidad horizontal', 8, 'm/s']], calculate: ({ height, horizontalVelocity, gravity }) => ({ title: 'Movimiento semiparabólico', formula: 'x = vₓ · √(2h/g)', values: `x = ${horizontalVelocity} · √(2 · ${height} / ${gravity})`, result: `Tiempo de caída: ${Math.sqrt(2 * height / gravity).toFixed(2)} s · Alcance: ${(horizontalVelocity * Math.sqrt(2 * height / gravity)).toFixed(2)} m`, path: 'parabola' }) },
        newton1: { category: 'Dinámica', fields: [['mass', 'Masa', 5, 'kg'], ['force', 'Fuerza neta', 0, 'N']], calculate: ({ force }) => ({ title: 'Primera ley de Newton', formula: 'ΣF = 0 → v constante', values: `ΣF = ${force} N`, result: force === 0 ? 'El cuerpo permanece en reposo o con velocidad constante.' : `Existe una fuerza neta de ${force.toFixed(2)} N.`, path: 'force' }) },
        newton2: { category: 'Dinámica', fields: [['mass', 'Masa', 5, 'kg'], ['force', 'Fuerza neta', 20, 'N']], calculate: ({ mass, force }) => ({ title: 'Segunda ley de Newton', formula: 'a = F / m', values: `a = ${force} / ${mass}`, result: `Aceleración: ${(force / mass).toFixed(2)} m/s²`, path: 'force' }) },
        newton3: { category: 'Dinámica', fields: [['force', 'Fuerza de acción', 30, 'N']], calculate: ({ force }) => ({ title: 'Tercera ley de Newton', formula: 'Fₐᵦ = −Fᵦₐ', values: `F reacción = −${force}`, result: `Acción: ${force.toFixed(2)} N · Reacción: ${(-force).toFixed(2)} N`, path: 'force' }) },
        torque: { category: 'Estática', fields: [['force', 'Fuerza', 40, 'N'], ['distance', 'Brazo de palanca', 0.5, 'm'], ['angle', 'Ángulo', 90, '°']], calculate: ({ force, distance, angle }) => ({ title: 'Torque o momento', formula: 'τ = rF sin(θ)', values: `τ = ${distance} · ${force} · sin(${angle}°)`, result: `Momento: ${(distance * force * Math.sin(angle * Math.PI / 180)).toFixed(2)} N·m`, path: 'torque' }) },
        rotational: { category: 'Estática', fields: [['forceA', 'Fuerza 1', 20, 'N'], ['distanceA', 'Brazo 1', 2, 'm'], ['distanceB', 'Brazo 2', 1, 'm']], calculate: ({ forceA, distanceA, distanceB }) => ({ title: 'Equilibrio de rotación', formula: 'Στ = 0 → F₁r₁ = F₂r₂', values: `F₂ = ${forceA} · ${distanceA} / ${distanceB}`, result: `Fuerza equilibrante: ${(forceA * distanceA / distanceB).toFixed(2)} N`, path: 'torque' }) },
        gravitycenter: { category: 'Estática', fields: [['massA', 'Masa A', 2, 'kg'], ['positionA', 'Posición A', 0, 'm'], ['massB', 'Masa B', 4, 'kg'], ['positionB', 'Posición B', 3, 'm']], calculate: ({ massA, positionA, massB, positionB }) => ({ title: 'Centro de gravedad', formula: 'xᶜᵍ = Σ(mx) / Σm', values: `xᶜᵍ = (${massA}·${positionA} + ${massB}·${positionB}) / (${massA} + ${massB})`, result: `Centro de gravedad: ${((massA * positionA + massB * positionB) / (massA + massB)).toFixed(2)} m`, path: 'center' }) }
    };

    function renderSimulationFields() {
        const type = document.getElementById('simulation-type').value;
        const definition = SIMULATION_DEFINITIONS[type];
        const fields = document.getElementById('simulation-fields');
        const category = document.getElementById('simulation-category');
        if (!definition || !fields) return;
        if (category) category.textContent = definition.category;
        fields.innerHTML = definition.fields.map(([id, label, value, unit]) => `<label class="field simulation-field"><span>${label} <small>(${unit})</small></span><input id="simulation-${id}" data-simulation-input="${id}" type="number" step="any" value="${value}" required /></label>`).join('');
    }

    function drawSimulationLegacy(result) {
        const canvas = document.getElementById('simulation-canvas');
        if (!canvas) return;
        const context = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        let frame = 0;
        cancelAnimationFrame(drawSimulation.animationId);
        const draw = () => {
            const time = frame / 60;
            const progress = (Math.sin(time * 1.8) + 1) / 2;
            context.clearRect(0, 0, width, height);
            context.fillStyle = '#0c1626';
            context.fillRect(0, 0, width, height);
            context.strokeStyle = 'rgba(148, 163, 184, 0.12)';
            context.lineWidth = 1;
            for (let x = 0; x <= width; x += 40) { context.beginPath(); context.moveTo(x, 0); context.lineTo(x, height); context.stroke(); }
            for (let y = 0; y <= height; y += 40) { context.beginPath(); context.moveTo(0, y); context.lineTo(width, y); context.stroke(); }
            context.strokeStyle = '#6ea8fe'; context.lineWidth = 3; context.fillStyle = '#fbbf24';
            if (result.path === 'circle') { context.beginPath(); context.arc(width / 2, height / 2, 100, 0, Math.PI * 2); context.stroke(); context.beginPath(); context.arc(width / 2 + Math.cos(time) * 100, height / 2 + Math.sin(time) * 100, 10, 0, Math.PI * 2); context.fill(); }
            else if (result.path === 'parabola') { context.beginPath(); context.moveTo(40, height - 35); context.quadraticCurveTo(width / 2, 40, width - 40, height - 35); context.stroke(); context.beginPath(); context.arc(40 + progress * (width - 80), height - 35 - Math.sin(progress * Math.PI) * 230, 10, 0, Math.PI * 2); context.fill(); }
            else if (result.path === 'vertical' || result.path === 'fall') { const y = 35 + progress * (height - 70); context.beginPath(); context.moveTo(width / 2, 20); context.lineTo(width / 2, height - 20); context.stroke(); context.beginPath(); context.arc(width / 2, y, 12, 0, Math.PI * 2); context.fill(); }
            else if (result.path === 'torque') { context.beginPath(); context.moveTo(width / 2 - 150, height / 2); context.lineTo(width / 2 + 150, height / 2); context.stroke(); context.beginPath(); context.arc(width / 2, height / 2, 14, 0, Math.PI * 2); context.fill(); context.beginPath(); context.arc(width / 2, height / 2, 80, -0.8, 0.8); context.stroke(); }
            else if (result.path === 'center') { context.fillStyle = '#6ea8fe'; context.fillRect(110, height / 2 - 18, 420, 36); context.fillStyle = '#fbbf24'; context.beginPath(); context.arc(320 + Math.sin(time) * 35, height / 2, 12, 0, Math.PI * 2); context.fill(); }
            else if (result.path === 'force') { context.beginPath(); context.moveTo(120, height / 2); context.lineTo(520, height / 2); context.stroke(); context.beginPath(); context.moveTo(520, height / 2); context.lineTo(490, height / 2 - 18); context.lineTo(490, height / 2 + 18); context.closePath(); context.fill(); }
            else { const x = 45 + progress * (width - 90); context.beginPath(); context.moveTo(40, height - 45); context.lineTo(width - 40, height - 45); context.stroke(); context.beginPath(); context.arc(x, height - 57, 12, 0, Math.PI * 2); context.fill(); }
            frame += 1;
            drawSimulation.animationId = requestAnimationFrame(draw);
        };
        draw();
    }

    function createSimulationMotion(type, values) {
        const gravity = values.gravity || 9.81;
        if (type === 'mru') return { kind: 'line', duration: Math.max(0.01, values.time), distance: values.velocity * values.time, velocity: values.velocity };
        if (type === 'circular') return { kind: 'circle', duration: Math.max(0.01, values.time), radius: values.radius, angularVelocity: values.angularVelocity };
        if (type === 'vertical') return { kind: 'vertical', duration: Math.max(0.01, values.time), height: values.initialHeight, initialHeight: values.initialHeight, initialVelocity: values.initialVelocity, gravity };
        if (type === 'launch') return { kind: 'vertical', duration: Math.max(0.01, 2 * values.initialVelocity / gravity), height: 0, initialHeight: 0, initialVelocity: values.initialVelocity, gravity };
        if (type === 'freefall') return { kind: 'vertical', duration: Math.max(0.01, values.time), height: values.height, initialHeight: values.height, initialVelocity: 0, gravity };
        if (type === 'parabolic') { const angle = values.angle * Math.PI / 180; return { kind: 'parabola', duration: Math.max(0.01, 2 * values.initialVelocity * Math.sin(angle) / gravity), velocity: values.initialVelocity, angle, gravity }; }
        if (type === 'semiparabolic') return { kind: 'parabola', duration: Math.max(0.01, Math.sqrt(2 * values.height / gravity)), velocity: values.horizontalVelocity, height: values.height, gravity, horizontal: true };
        if (type === 'newton2') return { kind: 'force', duration: 4, acceleration: values.force / Math.max(0.01, values.mass) };
        if (type === 'newton1') return { kind: 'force', duration: 4, acceleration: values.force / Math.max(0.01, values.mass) };
        if (type === 'newton3') return { kind: 'force', duration: 4, acceleration: values.force };
        if (type === 'torque') return { kind: 'torque', duration: 4, angularVelocity: values.force * values.distance * Math.sin(values.angle * Math.PI / 180) };
        if (type === 'rotational') return { kind: 'torque', duration: 4, angularVelocity: values.forceA * values.distanceA / Math.max(0.01, values.distanceB) };
        return { kind: 'center', duration: 4, position: (values.massA * values.positionA + values.massB * values.positionB) / Math.max(0.01, values.massA + values.massB) };
    }

    function drawSimulation(result) {
        const canvas = document.getElementById('simulation-canvas');
        if (!canvas || !result.motion) return;
        const context = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        const motion = result.motion;
        const animationDuration = Math.min(8, Math.max(1, motion.duration));
        const startedAt = performance.now();
        cancelAnimationFrame(drawSimulation.animationId);

        const draw = (now) => {
            const elapsed = ((now - startedAt) / 1000) % animationDuration;
            const physicalTime = elapsed * motion.duration / animationDuration;
            const progress = motion.duration ? physicalTime / motion.duration : 0;
            context.clearRect(0, 0, width, height);
            context.fillStyle = '#0c1626';
            context.fillRect(0, 0, width, height);
            context.strokeStyle = 'rgba(148, 163, 184, 0.12)';
            context.lineWidth = 1;
            for (let x = 0; x <= width; x += 40) { context.beginPath(); context.moveTo(x, 0); context.lineTo(x, height); context.stroke(); }
            for (let y = 0; y <= height; y += 40) { context.beginPath(); context.moveTo(0, y); context.lineTo(width, y); context.stroke(); }
            context.strokeStyle = '#6ea8fe';
            context.lineWidth = 3;
            context.fillStyle = '#fbbf24';

            if (motion.kind === 'line') {
                const normalizedDistance = motion.distance ? (motion.velocity * physicalTime) / motion.distance : 0;
                const x = 45 + Math.max(0, Math.min(1, normalizedDistance)) * (width - 90);
                context.beginPath(); context.moveTo(40, height - 45); context.lineTo(width - 40, height - 45); context.stroke();
                context.beginPath(); context.arc(x, height - 57, 12, 0, Math.PI * 2); context.fill();
            } else if (motion.kind === 'circle') {
                const radius = Math.max(25, Math.min(125, motion.radius * 30));
                const angle = motion.angularVelocity * physicalTime;
                context.beginPath(); context.arc(width / 2, height / 2, radius, 0, Math.PI * 2); context.stroke();
                context.beginPath(); context.arc(width / 2 + Math.cos(angle) * radius, height / 2 + Math.sin(angle) * radius, 10, 0, Math.PI * 2); context.fill();
            } else if (motion.kind === 'vertical') {
                const position = motion.initialHeight + motion.initialVelocity * physicalTime - 0.5 * motion.gravity * physicalTime * physicalTime;
                const totalHeight = Math.max(1, motion.initialHeight + Math.max(0, motion.initialVelocity * motion.initialVelocity / (2 * motion.gravity)));
                const y = height - 35 - Math.max(0, Math.min(1, position / totalHeight)) * (height - 70);
                context.beginPath(); context.moveTo(width / 2, 20); context.lineTo(width / 2, height - 20); context.stroke();
                context.beginPath(); context.arc(width / 2, y, 12, 0, Math.PI * 2); context.fill();
            } else if (motion.kind === 'parabola') {
                const angle = motion.horizontal ? 0 : motion.angle;
                const xDistance = motion.horizontal ? motion.velocity * physicalTime : motion.velocity * Math.cos(angle) * physicalTime;
                const yDistance = motion.horizontal ? motion.height - 0.5 * motion.gravity * physicalTime * physicalTime : motion.velocity * Math.sin(angle) * physicalTime - 0.5 * motion.gravity * physicalTime * physicalTime;
                const range = motion.horizontal ? motion.velocity * motion.duration : motion.velocity * Math.cos(angle) * motion.duration;
                const peak = motion.horizontal ? motion.height : motion.velocity * motion.velocity * Math.sin(angle) ** 2 / (2 * motion.gravity);
                const x = 40 + Math.max(0, Math.min(1, xDistance / Math.max(1, range))) * (width - 80);
                const y = height - 35 - Math.max(0, Math.min(1, yDistance / Math.max(1, peak))) * (height - 70);
                context.beginPath(); context.moveTo(40, height - 35); context.quadraticCurveTo(width / 2, 40, width - 40, height - 35); context.stroke();
                context.beginPath(); context.arc(x, y, 10, 0, Math.PI * 2); context.fill();
            } else if (motion.kind === 'torque') {
                const angle = motion.angularVelocity * physicalTime;
                context.beginPath(); context.moveTo(width / 2 - 150 * Math.cos(angle), height / 2 - 150 * Math.sin(angle)); context.lineTo(width / 2 + 150 * Math.cos(angle), height / 2 + 150 * Math.sin(angle)); context.stroke();
                context.beginPath(); context.arc(width / 2, height / 2, 14, 0, Math.PI * 2); context.fill();
            } else if (motion.kind === 'force') {
                const accelerationDistance = 0.5 * motion.acceleration * physicalTime * physicalTime;
                const x = Math.max(55, Math.min(width - 55, 55 + accelerationDistance * 12));
                context.beginPath(); context.moveTo(40, height / 2); context.lineTo(width - 40, height / 2); context.stroke();
                context.beginPath(); context.arc(x, height / 2, 12, 0, Math.PI * 2); context.fill();
            } else {
                context.fillStyle = '#6ea8fe'; context.fillRect(110, height / 2 - 18, 420, 36); context.fillStyle = '#fbbf24'; context.beginPath(); context.arc(320 + (motion.position / 5), height / 2, 12, 0, Math.PI * 2); context.fill();
            }
            drawSimulation.animationId = requestAnimationFrame(draw);
        };
        drawSimulation.animationId = requestAnimationFrame(draw);
    }

    function runSimulation() {
        const type = document.getElementById('simulation-type').value;
        const definition = SIMULATION_DEFINITIONS[type];
        const values = {};
        const gravityInput = document.getElementById('simulation-gravity');
        const rawGravity = Number(gravityInput?.value);
        const gravity = Number.isFinite(rawGravity) ? Math.min(30, Math.max(0.01, rawGravity)) : 9.81;
        if (gravityInput) gravityInput.value = gravity.toFixed(2);
        definition.fields.forEach(([id]) => {
            const input = document.getElementById(`simulation-${id}`);
            const rawValue = Number(input?.value);
            const value = Number.isFinite(rawValue) ? rawValue : 0;
            values[id] = ['mass', 'massA', 'massB'].includes(id)
                ? Math.max(0.01, value)
                : ['radius', 'time', 'height', 'initialHeight', 'initialVelocity', 'horizontalVelocity', 'angularVelocity'].includes(id)
                    ? Math.max(0, value)
                    : id === 'distanceB'
                        ? Math.max(0.01, value)
                        : value;
            if (input) input.value = String(values[id]);
        });
        values.gravity = gravity;
        const result = definition.calculate(values);
        result.motion = createSimulationMotion(type, values);
        const resultBox = document.getElementById('simulation-result');
        resultBox.innerHTML = `<strong>${result.title}</strong><span>${result.formula}</span><span>${result.values}</span><b>${result.result}</b>`;
        drawSimulation(result);
    }

    async function updateMenuSummary() {
        const username = AuthSystem.getSession();
        const greeting = document.getElementById('welcome-user');
        if (greeting) {
            greeting.textContent = username ? `Bienvenido, ${username}` : 'Bienvenido';
        }

        const summary = await HistoryStore.getGlobalSummary();
        const summaryTotal = document.getElementById('summary-total');
        const summaryAverage = document.getElementById('summary-average');
        if (summaryTotal) summaryTotal.textContent = String(summary.total);
        if (summaryAverage) summaryAverage.textContent = summary.average;

        const topBtn = document.getElementById('btn-logout-top');
        if (topBtn) {
            topBtn.classList.toggle('hidden', !AuthSystem.isLoggedIn());
        }

        const adminBtn = document.getElementById('btn-admin-panel');
        if (adminBtn) {
            adminBtn.classList.toggle('hidden', !AuthSystem.isAdmin());
        }
    }

    async function fetchAdmin(path, options = {}) {
        const adminUser = AuthSystem.getSession();
        const response = await fetch(`${API_BASE}${path}`, {
            ...options,
            headers: {
                ...(options.headers || {}),
                'Content-Type': 'application/json',
                'x-session-token': AuthSystem.getSessionToken()
            }
        });
        let result = {};
        try {
            result = await response.json();
        } catch (error) {
            result = {};
        }
        return { ok: response.ok, result };
    }

    async function updateApiKeyFromAdmin() {
        const input = document.getElementById('admin-api-key');
        if (!input) return;
        const apiKey = input.value.trim();
        const response = await fetchAdmin('/admin/settings/api-key', {
            method: 'PUT',
            body: JSON.stringify({ apiKey })
        });
        if (response.ok) {
            showToast('API key actualizada');
        } else {
            showToast(response.result.message || 'No se pudo actualizar la API key');
        }
    }

    function renderAdminHistoryRows(history) {
        const container = document.getElementById('admin-history-list');
        if (!container) return;
        if (!Array.isArray(history) || !history.length) {
            container.innerHTML = '<div class="history-item"><div><strong>Sin resultados</strong><small>No hay registros disponibles.</small></div></div>';
            return;
        }

        container.innerHTML = history.map((entry) => {
            return `
                <div class="admin-row">
                    <div>
                        <strong>${escapeHtml(entry.username)}</strong>
                        <small>${escapeHtml(new Date(entry.created_at).toLocaleString('es-ES'))}</small>
                    </div>
                    <small>${escapeHtml(entry.subject)} · ${escapeHtml(entry.topic || 'general')} · ${escapeHtml(entry.difficulty)}</small>
                    <small>Puntaje: ${escapeHtml(entry.score)}/${escapeHtml(entry.total_questions)}</small>
                    <div class="admin-actions">
                        <button type="button" data-admin-history-edit="${entry.id}">Editar</button>
                        <button type="button" data-admin-history-delete="${entry.id}">Eliminar</button>
                    </div>
                </div>
            `;
        }).join('');

        container.querySelectorAll('[data-admin-history-edit]').forEach((button) => {
            button.addEventListener('click', async () => {
                const id = Number(button.dataset.adminHistoryEdit);
                const score = Number(prompt('Nueva puntuación', '0')) || 0;
                const total = Number(prompt('Total de preguntas', '10')) || 10;
                const subject = prompt('Materia', 'general') || 'general';
                const topic = prompt('Tema', 'general') || 'general';
                const difficulty = prompt('Nivel', 'Normal') || 'Normal';
                const response = await fetchAdmin(`/admin/history/${id}`, {
                    method: 'PATCH',
                    body: JSON.stringify({ score, total, subject, topic, difficulty })
                });
                if (response.ok) {
                    showToast('Resultado actualizado');
                    await loadAdminPanel();
                } else {
                    showToast(response.result.message || 'No se pudo actualizar');
                }
            });
        });

        container.querySelectorAll('[data-admin-history-delete]').forEach((button) => {
            button.addEventListener('click', async () => {
                const id = Number(button.dataset.adminHistoryDelete);
                if (!confirm('¿Deseas eliminar este resultado?')) return;
                const response = await fetch(`${API_BASE}/admin/history/${id}`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json', 'x-session-token': AuthSystem.getSessionToken() }
                });
                if (response.ok) {
                    showToast('Registro eliminado');
                    await loadAdminPanel();
                } else {
                    showToast('No se pudo eliminar');
                }
            });
        });
    }

    function renderAdminUserRows(users) {
        const container = document.getElementById('admin-user-list');
        if (!container) return;
        if (!Array.isArray(users) || !users.length) {
            container.innerHTML = '<div class="history-item"><div><strong>Sin usuarios</strong><small>Aún no hay cuentas registradas.</small></div></div>';
            return;
        }

        container.innerHTML = users.map((user) => {
            const owner = user.username === ADMIN_USERNAME;
            return `
                <div class="admin-row ${owner ? 'admin-owner' : ''}">
                    <div>
                        <strong>${escapeHtml(user.username)}${owner ? ' ★' : ''}</strong>
                        <small>Rol: ${escapeHtml(user.role || 'user')} · Estado: ${escapeHtml(user.status || 'active')}</small>
                    </div>
                    <div class="admin-actions">
                        <button type="button" data-admin-user-toggle-role="${user.id}">${(user.role || 'user') === 'admin' ? 'Quitar admin' : 'Dar admin'}</button>
                        <button type="button" data-admin-user-toggle-ban="${user.id}">${(user.status || 'active') === 'banned' ? 'Desbanear' : 'Banear'}</button>
                        <button type="button" data-admin-user-toggle-block="${user.id}">${(user.status || 'active') === 'blocked' ? 'Desbloquear' : 'Bloquear'}</button>
                        <button type="button" data-admin-user-rename="${user.id}">Renombrar</button>
                        <button type="button" data-admin-user-password="${user.id}">Contraseña</button>
                        <button type="button" data-admin-user-delete="${user.id}">Eliminar</button>
                    </div>
                </div>
            `;
        }).join('');

        container.querySelectorAll('[data-admin-user-toggle-role]').forEach((button) => {
            button.addEventListener('click', async () => {
                const id = Number(button.dataset.adminUserToggleRole);
                const result = await fetchAdmin(`/admin/users/${id}`, {
                    method: 'PATCH',
                    body: JSON.stringify({ action: 'toggleAdmin' })
                });
                if (result.ok) {
                    showToast(result.result.message || 'Cambio aplicado');
                    await loadAdminPanel();
                } else {
                    showToast(result.result.message || 'No se pudo cambiar');
                }
            });
        });

        container.querySelectorAll('[data-admin-user-toggle-ban]').forEach((button) => {
            button.addEventListener('click', async () => {
                const id = Number(button.dataset.adminUserToggleBan);
                const result = await fetchAdmin(`/admin/users/${id}`, {
                    method: 'PATCH',
                    body: JSON.stringify({ action: 'toggleBan' })
                });
                if (result.ok) {
                    showToast(result.result.message || 'Cambio aplicado');
                    await loadAdminPanel();
                } else {
                    showToast(result.result.message || 'No se pudo cambiar');
                }
            });
        });

        container.querySelectorAll('[data-admin-user-toggle-block]').forEach((button) => {
            button.addEventListener('click', async () => {
                const id = Number(button.dataset.adminUserToggleBlock);
                const result = await fetchAdmin(`/admin/users/${id}`, {
                    method: 'PATCH',
                    body: JSON.stringify({ action: 'toggleBlock' })
                });
                if (result.ok) {
                    showToast(result.result.message || 'Cambio aplicado');
                    await loadAdminPanel();
                } else {
                    showToast(result.result.message || 'No se pudo cambiar');
                }
            });
        });

        container.querySelectorAll('[data-admin-user-rename]').forEach((button) => {
            button.addEventListener('click', async () => {
                const id = Number(button.dataset.adminUserRename);
                const newUsername = prompt('Nuevo nombre de usuario', 'usuario_nuevo');
                if (!newUsername) return;
                const result = await fetchAdmin(`/admin/users/${id}`, {
                    method: 'PATCH',
                    body: JSON.stringify({ action: 'changeUsername', newUsername })
                });
                if (result.ok) {
                    showToast(result.result.message || 'Usuario actualizado');
                    await loadAdminPanel();
                } else {
                    showToast(result.result.message || 'No se pudo actualizar');
                }
            });
        });

        container.querySelectorAll('[data-admin-user-password]').forEach((button) => {
            button.addEventListener('click', async () => {
                const id = Number(button.dataset.adminUserPassword);
                const newPassword = prompt('Nueva contraseña (mínimo 4 caracteres)', '');
                if (!newPassword) return;
                const result = await fetchAdmin(`/admin/users/${id}`, {
                    method: 'PATCH',
                    body: JSON.stringify({ action: 'changePassword', newPassword })
                });
                if (result.ok) {
                    showToast(result.result.message || 'Contraseña actualizada');
                } else {
                    showToast(result.result.message || 'No se pudo actualizar');
                }
            });
        });

        container.querySelectorAll('[data-admin-user-delete]').forEach((button) => {
            button.addEventListener('click', async () => {
                const id = Number(button.dataset.adminUserDelete);
                if (!confirm('¿Deseas eliminar esta cuenta?')) return;
                const result = await fetchAdmin(`/admin/users/${id}`, {
                    method: 'PATCH',
                    body: JSON.stringify({ action: 'delete' })
                });
                if (result.ok) {
                    showToast(result.result.message || 'Cuenta eliminada');
                    await loadAdminPanel();
                } else {
                    showToast(result.result.message || 'No se pudo eliminar');
                }
            });
        });
    }

    async function loadAdminPanel() {
        const usersResult = await fetchAdmin('/admin/users');
        const historyResult = await fetchAdmin('/admin/history');
        if (usersResult.ok && Array.isArray(usersResult.result.users)) {
            renderAdminUserRows(usersResult.result.users);
        } else {
            const container = document.getElementById('admin-user-list');
            if (container) container.innerHTML = '<div class="history-item"><div><strong>Error</strong><small>No se pudo cargar la lista.</small></div></div>';
        }

        if (historyResult.ok && Array.isArray(historyResult.result.history)) {
            renderAdminHistoryRows(historyResult.result.history);
        } else {
            const container = document.getElementById('admin-history-list');
            if (container) container.innerHTML = '<div class="history-item"><div><strong>Error</strong><small>No se pudo cargar el historial.</small></div></div>';
        }
    }

    async function renderHistory() {
        const username = AuthSystem.getSession();
        const summary = await HistoryStore.getGlobalSummary();
        const globalSummaryBox = document.getElementById('global-summary');
        if (globalSummaryBox) {
            if (!summary.total) {
                globalSummaryBox.innerHTML = '<div class="history-item"><div><strong>No hay registros</strong><small>Aún no se han realizado evaluaciones.</small></div></div>';
            } else {
                globalSummaryBox.innerHTML = summary.top.map((entry, index) => {
                    const isAdmin = entry.username === ADMIN_USERNAME;
                    return `
                        <div class="history-item ${isAdmin ? 'admin-entry' : ''}">
                            <div>
                                <strong>#${index + 1} ${escapeHtml(entry.username)}</strong>
                                <small>${escapeHtml(entry.subject)} · ${escapeHtml(entry.topic || 'general')}</small>
                            </div>
                            <div>
                                <strong>${escapeHtml(entry.score)}/${escapeHtml(entry.total_questions)}</strong>
                                <small>${escapeHtml(new Date(entry.created_at).toLocaleString('es-ES'))}</small>
                            </div>
                        </div>
                    `;
                }).join('');
            }
        }

        const userHistoryBox = document.getElementById('user-history');
        if (userHistoryBox) {
            const entries = username ? await HistoryStore.load() : [];
            const userEntries = entries.filter((entry) => entry.username === username);
            if (!userEntries.length) {
                userHistoryBox.innerHTML = '<div class="history-item"><div><strong>Sin resultados</strong><small>Tu historial aparecerá aquí.</small></div></div>';
            } else {
                userHistoryBox.innerHTML = userEntries.map((entry) => {
                    return `
                        <div class="history-item">
                            <div>
                                <strong>${escapeHtml(entry.subject)}</strong>
                                <small>${escapeHtml(new Date(entry.created_at).toLocaleString('es-ES'))}</small>
                            </div>
                            <div>
                                <strong>${escapeHtml(entry.score)}/${escapeHtml(entry.total_questions)}</strong>
                                <small>${escapeHtml(entry.difficulty)}</small>
                            </div>
                        </div>
                    `;
                }).join('');
            }
        }
    }

    function buildExamSettings() {
        const subject = document.getElementById('exam-subject').value;
        const topic = document.getElementById('exam-topic').value.trim();
        const difficulty = document.getElementById('exam-difficulty').value;
        const count = Number(document.getElementById('exam-count').value) || 10;
        return { subject, topic, difficulty, count };
    }

    function renderQuestion() {
        if (currentExam.currentIndex >= currentExam.questions.length) {
            finishExam();
            return;
        }

        const item = currentExam.questions[currentExam.currentIndex];
        const questionText = document.getElementById('question-text');
        const difficultyBadge = document.getElementById('difficulty-badge');
        const scoreEl = document.getElementById('score');
        const timerEl = document.getElementById('timer');
        const counterEl = document.getElementById('question-counter');
        const optionsEl = document.getElementById('options');
        const progressBar = document.getElementById('progress-bar');

        if (questionText) questionText.textContent = item.question;
        if (difficultyBadge) {
            const label = DIFFICULTY_SETTINGS[currentExam.difficulty]?.label || 'Normal';
            difficultyBadge.textContent = label;
        }
        if (scoreEl) scoreEl.textContent = String(currentExam.score);
        if (counterEl) counterEl.textContent = `${currentExam.currentIndex + 1}/${currentExam.questions.length}`;
        if (progressBar) {
            const progress = ((currentExam.currentIndex + 1) / currentExam.questions.length) * 100;
            progressBar.style.width = `${progress}%`;
        }

        if (optionsEl) {
            optionsEl.innerHTML = '';
            item.options.forEach((option, index) => {
                const optionButton = document.createElement('button');
                optionButton.type = 'button';
                optionButton.className = 'option-button';
                optionButton.textContent = option;
                optionButton.addEventListener('click', () => answerQuestion(index, optionButton));
                optionsEl.appendChild(optionButton);
            });
        }

        startTimer();
    }

    function answerQuestion(selectedIndex, buttonNode) {
        const item = currentExam.questions[currentExam.currentIndex];
        const buttons = [...document.querySelectorAll('.option-button')];
        buttons.forEach((button) => {
            button.disabled = true;
            button.classList.add('disabled');
            if (button.textContent === item.options[item.correctIndex]) {
                button.classList.add('correct');
            }
        });

        if (Number(selectedIndex) === Number(item.correctIndex)) {
            currentExam.score += 1;
            buttonNode.classList.add('correct');
            showToast('Respuesta correcta');
        } else {
            buttonNode.classList.add('incorrect');
            showToast(`Incorrecto. La correcta era: ${item.options[item.correctIndex]}`);
        }

        updateScoreDisplay();
        clearInterval(currentExam.timerId);

        setTimeout(() => {
            currentExam.currentIndex += 1;
            renderQuestion();
        }, 900);
    }

    function updateScoreDisplay() {
        const scoreEl = document.getElementById('score');
        if (scoreEl) scoreEl.textContent = String(currentExam.score);
    }

    function startTimer() {
        clearInterval(currentExam.timerId);
        const settings = DIFFICULTY_SETTINGS[currentExam.difficulty] || DIFFICULTY_SETTINGS.normal;
        currentExam.timeRemaining = Math.round(currentExam.questions.length * settings.secondsPerQuestion);
        const timerEl = document.getElementById('timer');
        if (timerEl) timerEl.textContent = String(currentExam.timeRemaining);

        currentExam.timerId = setInterval(() => {
            currentExam.timeRemaining -= 1;
            if (timerEl) timerEl.textContent = String(currentExam.timeRemaining);
            if (currentExam.timeRemaining <= 0) {
                clearInterval(currentExam.timerId);
                const buttons = [...document.querySelectorAll('.option-button')];
                buttons.forEach((button) => {
                    button.disabled = true;
                    button.classList.add('disabled');
                });
                showToast('Se acabó el tiempo.');
                setTimeout(() => {
                    currentExam.currentIndex += 1;
                    renderQuestion();
                }, 800);
            }
        }, 1000);
    }

    async function finishExam() {
        clearInterval(currentExam.timerId);
        const total = currentExam.questions.length || 1;
        const scorePercent = Math.round((currentExam.score / total) * 100);
        const grade = (currentExam.score / total) * 5;
        const finalScore = document.getElementById('final-score');
        const finalGrade = document.getElementById('final-grade');
        const resultMessage = document.getElementById('result-message');

        if (finalScore) finalScore.textContent = `${currentExam.score}/${total}`;
        if (finalGrade) finalGrade.textContent = grade.toFixed(1);

        if (resultMessage) {
            if (scorePercent >= 80) {
                resultMessage.textContent = 'Rendimiento destacado. La preparación y la estrategia han sido excelentes.';
            } else if (scorePercent >= 60) {
                resultMessage.textContent = 'Buen rendimiento. Hay margen para mejorar en los puntos más difíciles.';
            } else if (scorePercent >= 40) {
                resultMessage.textContent = 'Rendimiento aceptable. La práctica adicional te permitirá más confianza.';
            } else {
                resultMessage.textContent = 'El resultado indica que es necesario reforzar el contenido y volver a intentarlo.';
            }
        }

        const username = AuthSystem.getSession();
        if (username) {
            const saved = await HistoryStore.saveResult({
                username,
                subject: currentExam.subject,
                topic: currentExam.topic || 'general',
                difficulty: DIFFICULTY_SETTINGS[currentExam.difficulty]?.label || 'Normal',
                score: currentExam.score,
                total,
                created_at: new Date().toISOString()
            });
            if (!saved) showToast('El resultado no se pudo guardar en el servidor.');
        }

        await renderHistory();
        await updateMenuSummary();
        showView('result-view');
    }

    function exitExamToMenu() {
        if (!confirm('¿Deseas salir del examen?')) return;
        clearInterval(currentExam.timerId);
        currentExam.currentIndex = 0;
        currentExam.score = 0;
        currentExam.questions = [];
        showView('menu-view');
    }

    async function startExamFromConfig() {
        const settings = buildExamSettings();
        const count = Math.min(100, Math.max(5, Number(settings.count) || 10));

        currentExam.subject = settings.subject;
        currentExam.topic = settings.topic;
        currentExam.difficulty = settings.difficulty;
        currentExam.count = count;
        currentExam.score = 0;
        currentExam.currentIndex = 0;
        currentExam.startedAt = Date.now();

        try {
            const response = await fetch(`${API_BASE}/questions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subject: settings.subject,
                    topic: settings.topic,
                    difficulty: settings.difficulty,
                    count
                })
            });

            const result = await response.json();

            if (!response.ok || !Array.isArray(result.questions) || !result.questions.length) {
                throw new Error(result.message || 'No se pudieron generar preguntas.');
            }

            currentExam.questions = result.questions.map((item) => {
                const sourceOptions = Array.isArray(item.options) ? item.options : [];
                const correctOption = sourceOptions[Number(item.correctIndex ?? 0)];
                const options = shuffleOptions(sourceOptions);
                return {
                    question: item.question,
                    options,
                    correctIndex: options.indexOf(correctOption),
                    difficulty: settings.difficulty
                };
            });

            if (!currentExam.questions.length) {
                throw new Error('El backend no devolvió preguntas válidas.');
            }

            showView('playing-view');
            renderQuestion();
            return;
        } catch (error) {
            console.error('Fallo al pedir preguntas al backend:', error);
            showToast(error.message || 'No se pudo conectar con la IA.');
            return;
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');
        const examForm = document.getElementById('exam-form');
        const btnGoLogin = document.getElementById('btn-go-login');
        const btnGoRegister = document.getElementById('btn-go-register');
        const btnLoginBack = document.getElementById('btn-login-back');
        const btnRegisterBack = document.getElementById('btn-register-back');
        const btnStartExam = document.getElementById('btn-start-exam');
        const btnSimulator = document.getElementById('btn-simulator');
        const btnSimulatorBack = document.getElementById('btn-simulator-back');
        const simulatorForm = document.getElementById('simulator-form');
        const simulationType = document.getElementById('simulation-type');
        const btnHistory = document.getElementById('btn-history');
        const btnConfigBack = document.getElementById('btn-config-back');
        const btnHistoryBack = document.getElementById('btn-history-back');
        const btnClearHistory = document.getElementById('btn-clear-history');
        const btnResultBack = document.getElementById('btn-result-back');
        const btnLogoutTop = document.getElementById('btn-logout-top');
        const btnAdminPanel = document.getElementById('btn-admin-panel');
        const btnAdminBack = document.getElementById('btn-admin-back');
        const btnBackToMenu = document.getElementById('btn-back-to-menu');
        const btnExitExam = document.getElementById('btn-exit-exam');
        const btnResetLeaderboard = document.getElementById('btn-reset-leaderboard');
        const btnUpdateApiKey = document.getElementById('btn-update-api-key');

        if (btnGoLogin) {
            btnGoLogin.addEventListener('click', () => showView('login-view'));
        }

        if (btnGoRegister) {
            btnGoRegister.addEventListener('click', () => showView('register-view'));
        }

        if (btnLoginBack) {
            btnLoginBack.addEventListener('click', () => showView('welcome-view'));
        }

        if (btnRegisterBack) {
            btnRegisterBack.addEventListener('click', () => showView('welcome-view'));
        }

        if (btnStartExam) {
            btnStartExam.addEventListener('click', () => showView('config-view'));
        }

        if (btnSimulator) {
            btnSimulator.addEventListener('click', () => {
                renderSimulationFields();
                showView('simulator-view');
            });
        }

        if (btnSimulatorBack) {
            btnSimulatorBack.addEventListener('click', () => {
                cancelAnimationFrame(drawSimulation.animationId);
                showView('menu-view');
            });
        }

        if (simulationType) {
            simulationType.addEventListener('change', renderSimulationFields);
        }

        if (simulatorForm) {
            simulatorForm.addEventListener('submit', (event) => {
                event.preventDefault();
                runSimulation();
            });
        }

        if (btnHistory) {
            btnHistory.addEventListener('click', async () => {
                await renderHistory();
                showView('history-view');
            });
        }

        if (btnConfigBack) {
            btnConfigBack.addEventListener('click', () => showView('menu-view'));
        }

        if (btnHistoryBack) {
            btnHistoryBack.addEventListener('click', () => showView('menu-view'));
        }

        if (btnClearHistory) {
            btnClearHistory.addEventListener('click', async () => {
                if (confirm('¿Deseas borrar todo el historial?')) {
                    await HistoryStore.clear();
                    await renderHistory();
                    await updateMenuSummary();
                    showToast('Historial borrado');
                }
            });
        }

        if (btnResultBack) {
            btnResultBack.addEventListener('click', () => showView('menu-view'));
        }

        if (btnExitExam) {
            btnExitExam.addEventListener('click', exitExamToMenu);
        }

        if (btnLogoutTop) {
            btnLogoutTop.addEventListener('click', () => {
                AuthSystem.logout();
                updateMenuSummary();
                showView('welcome-view');
                showToast('Sesión cerrada');
            });
        }

        if (btnAdminPanel) {
            btnAdminPanel.addEventListener('click', async () => {
                if (!AuthSystem.isAdmin()) {
                    showToast('Solo el administrador puede acceder.');
                    return;
                }
                await loadAdminPanel();
                showView('admin-view');
            });
        }

        if (btnAdminBack) {
            btnAdminBack.addEventListener('click', () => showView('menu-view'));
        }

        if (btnResetLeaderboard) {
            btnResetLeaderboard.addEventListener('click', async () => {
                if (!confirm('¿Deseas reiniciar la tablilla global?')) return;
                const response = await fetchAdmin('/admin/reset-history', { method: 'POST' });
                if (response.ok) {
                    showToast('Tablilla reiniciada');
                    await renderHistory();
                    await loadAdminPanel();
                } else {
                    showToast(response.result.message || 'No se pudo reiniciar');
                }
            });
        }

        if (btnUpdateApiKey) {
            btnUpdateApiKey.addEventListener('click', updateApiKeyFromAdmin);
        }

        if (btnBackToMenu) {
            btnBackToMenu.addEventListener('click', () => showView('menu-view'));
        }

        if (loginForm) {
            loginForm.addEventListener('submit', async (event) => {
                event.preventDefault();
                const username = document.getElementById('login-user').value;
                const password = document.getElementById('login-pass').value;
                const errorBox = document.getElementById('login-error');
                const result = await AuthSystem.login(username, password);

                if (!result.success) {
                    errorBox.textContent = result.message;
                    return;
                }

                errorBox.textContent = '';
                await updateMenuSummary();
                showView('menu-view');
                showToast('Sesión iniciada');
            });
        }

        if (registerForm) {
            registerForm.addEventListener('submit', async (event) => {
                event.preventDefault();
                const username = document.getElementById('register-user').value;
                const password = document.getElementById('register-pass').value;
                const confirm = document.getElementById('register-pass-confirm').value;
                const errorBox = document.getElementById('register-error');

                if (password !== confirm) {
                    errorBox.textContent = 'Las contraseñas no coinciden.';
                    return;
                }

                const result = await AuthSystem.register(username, password);
                if (!result.success) {
                    errorBox.textContent = result.message;
                    return;
                }

                errorBox.textContent = '';
                await AuthSystem.login(username, password);
                await updateMenuSummary();
                showView('menu-view');
                showToast('Cuenta creada');
            });
        }

        if (examForm) {
            examForm.addEventListener('submit', (event) => {
                event.preventDefault();
                startExamFromConfig();
            });
        }

        if (AuthSystem.isLoggedIn()) {
            updateMenuSummary();
            showView('menu-view');
        } else {
            showView('welcome-view');
        }

        renderHistory();
        updateMenuSummary();
    });
})();
