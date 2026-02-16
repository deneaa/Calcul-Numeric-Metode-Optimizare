// ============================================
// script.js - Interfața pentru metode numerice
// ============================================

// Preiau toate elementele din DOM
let canvas = document.getElementById("grafic-canvas");
let ctx = canvas.getContext("2d");
let radioCollectie = document.getElementById("mod-collectie");
let radioInteractiv = document.getElementById("mod-interactiv");
let selectFunctie = document.getElementById("select-functie");
let campFunctie = document.getElementById("camp-functie");
let inputA = document.getElementById("a-interval");
let inputB = document.getElementById("b-interval");
let selectMetoda = document.getElementById("select-metoda");
let epsInput = document.getElementById("eps");
let butonExecuta = document.getElementById("buton-executa");
let tabelBody = document.querySelector("#tabel-rezultate tbody");

// **********************************************************
// FUNCTII PENTRU PARSAREA EXPRESIILOR
// **********************************************************

// Verifica daca e cifra
function eCifra(c) {
    return (c >= "0" && c <= "9") || c === ".";
}

// Verifica daca e litera
function eLitera(c) {
    return (c >= "a" && c <= "z") || (c >= "A" && c <= "Z");
}

// Inlocueste ^ cu Math.pow
function inlocuiestePutere(s) {
    while (s.indexOf("^") !== -1) {
        let pos = s.indexOf("^");

        // Gasesc baza (stanga)
        let sfarsitBaza = pos - 1;
        let inceputBaza;
        
        if (s[sfarsitBaza] === ")") {
            let depth = 1;
            let j = sfarsitBaza - 1;
            while (j >= 0 && depth > 0) {
                if (s[j] === ")") depth++;
                if (s[j] === "(") depth--;
                j--;
            }
            inceputBaza = j + 1;
        } else {
            let j = sfarsitBaza;
            while (j >= 0 && (eLitera(s[j]) || eCifra(s[j]) || s[j] === ".")) {
                j--;
            }
            inceputBaza = j + 1;
        }

        // Gasesc exponentul (dreapta)
        let inceputExp = pos + 1;
        let sfarsitExp;
        
        if (s[inceputExp] === "(") {
            let depth = 1;
            let j = inceputExp + 1;
            while (j < s.length && depth > 0) {
                if (s[j] === "(") depth++;
                if (s[j] === ")") depth--;
                j++;
            }
            sfarsitExp = j - 1;
        } else if (s[inceputExp] === "-") {
            let j = inceputExp + 1;
            while (j < s.length && (eCifra(s[j]) || s[j] === ".")) {
                j++;
            }
            sfarsitExp = j - 1;
        } else {
            let j = inceputExp;
            while (j < s.length && (eCifra(s[j]) || eLitera(s[j]) || s[j] === ".")) {
                j++;
            }
            sfarsitExp = j - 1;
        }

        let baza = s.substring(inceputBaza, sfarsitBaza + 1);
        let exponent = s.substring(inceputExp, sfarsitExp + 1);
        
        s = s.substring(0, inceputBaza) + "Math.pow(" + baza + "," + exponent + ")" + s.substring(sfarsitExp + 1);
    }
    return s;
}

// Parseaza expresia matematica
function parseazaExpresie(expr) {
    let s = expr;
    s = s.replace(/\s+/g, "");                     // scap de spatii
    
    // Constante matematice
    s = s.replace(/e\^\(/g, "Math.exp(");
    s = s.replace(/e\^([a-zA-Z0-9.]+)/g, "Math.exp($1)");
    s = inlocuiestePutere(s);
    s = s.replace(/(?<![a-zA-Z])e(?![a-zA-Z(])/g, "Math.E");
    s = s.replace(/sin\(/g, "Math.sin(");
    s = s.replace(/cos\(/g, "Math.cos(");
    s = s.replace(/tan\(/g, "Math.tan(");
    s = s.replace(/log\(/g, "Math.log10(");
    s = s.replace(/ln\(/g, "Math.log(");
    s = s.replace(/abs\(/g, "Math.abs(");
    s = s.replace(/sqrt\(/g, "Math.sqrt(");
    
    return s;
}

// Construieste functia executabila
function construiesteFunctie(expr) {
    let parsed = parseazaExpresie(expr);
    try {
        let fn = new Function("x", "return " + parsed + ";");
        fn(0); // test
        return fn;
    } catch (e) {
        alert("Eroare la functie: " + expr + "\nParsat: " + parsed);
        return null;
    }
}

// **********************************************************
// FUNCTII PENTRU GRAFIC
// **********************************************************

// Calculeaza pasul pentru grid
function pasOptim(domeniu, liniiDorite) {
    let rough = domeniu / liniiDorite;
    let magnitudine = Math.pow(10, Math.floor(Math.log10(rough)));
    let normalizat = rough / magnitudine;
    let pas;
    
    if (normalizat < 1.5) pas = 1;
    else if (normalizat < 3.5) pas = 2;
    else if (normalizat < 7.5) pas = 5;
    else pas = 10;
    
    return pas * magnitudine;
}

// Formateaza valorile pentru axa
function etichetaRotunjita(val) {
    if (Math.abs(val) < 1e-10) return "0";
    if (Math.abs(val) >= 1000 || Math.abs(val) < 0.01) {
        return val.toExponential(1);
    }
    return parseFloat(val.toPrecision(4)).toString();
}

// Deseneaza graficul
function deseneazaGrafic(fn, a, b, radacini, iteratii, metoda, precizie) {
    // Setez dimensiunile canvas
    let container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;

    let latime = canvas.width;
    let inaltime = canvas.height;

    // Marginile graficului
    let stanga = 50;
    let dreapta = 20;
    let sus = 20;
    let jos = 35;

    let plotLatime = latime - stanga - dreapta;
    let plotInaltime = inaltime - sus - jos;

    // Limitele pe X
    let margine = (b - a) * 0.1;
    let xMin = a - margine;
    let xMax = b + margine;

    // Calculez punctele
    let numarPuncte = 500;
    let dx = (xMax - xMin) / numarPuncte;
    let valoriY = [];
    
    for (let i = 0; i <= numarPuncte; i++) {
        let xi = xMin + i * dx;
        let yi = fn(xi);
        if (isFinite(yi)) {
            valoriY.push(yi);
        }
    }

    if (valoriY.length === 0) {
        alert("Functia nu are valori finite pe intervalul asta.");
        return;
    }

    // Gasesc min/max pe Y
    let yMin = valoriY[0];
    let yMax = valoriY[0];
    for (let i = 1; i < valoriY.length; i++) {
        if (valoriY[i] < yMin) yMin = valoriY[i];
        if (valoriY[i] > yMax) yMax = valoriY[i];
    }

    // Adaug spatiu in jur
    let yMargine = (yMax - yMin) * 0.1;
    if (yMargine === 0) yMargine = 1;
    yMin -= yMargine;
    yMax += yMargine;

    // Functii de conversie
    function laPixelX(x) {
        return stanga + ((x - xMin) / (xMax - xMin)) * plotLatime;
    }
    
    function laPixelY(y) {
        return sus + (1 - (y - yMin) / (yMax - yMin)) * plotInaltime;
    }

    // Curat canvasul
    ctx.clearRect(0, 0, latime, inaltime);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, latime, inaltime);

    // Desenez gridul
    ctx.strokeStyle = "#e0e0e0";
    ctx.lineWidth = 0.5;

    let xPas = pasOptim(xMax - xMin, 8);
    let yPas = pasOptim(yMax - yMin, 8);

    // Linii verticale
    let xGridStart = Math.ceil(xMin / xPas) * xPas;
    for (let gx = xGridStart; gx <= xMax; gx += xPas) {
        let px = laPixelX(gx);
        ctx.beginPath();
        ctx.moveTo(px, sus);
        ctx.lineTo(px, sus + plotInaltime);
        ctx.stroke();
    }

    // Linii orizontale
    let yGridStart = Math.ceil(yMin / yPas) * yPas;
    for (let gy = yGridStart; gy <= yMax; gy += yPas) {
        let py = laPixelY(gy);
        ctx.beginPath();
        ctx.moveTo(stanga, py);
        ctx.lineTo(stanga + plotLatime, py);
        ctx.stroke();
    }

    // Axele principale
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 1.5;

    if (yMin <= 0 && yMax >= 0) {
        let y0px = laPixelY(0);
        ctx.beginPath();
        ctx.moveTo(stanga, y0px);
        ctx.lineTo(stanga + plotLatime, y0px);
        ctx.stroke();
    }

    if (xMin <= 0 && xMax >= 0) {
        let x0px = laPixelX(0);
        ctx.beginPath();
        ctx.moveTo(x0px, sus);
        ctx.lineTo(x0px, sus + plotInaltime);
        ctx.stroke();
    }

    // Valorile pe axe
    ctx.fillStyle = "#333333";
    ctx.font = "10px Arial";
    ctx.textAlign = "center";

    for (let gx = xGridStart; gx <= xMax; gx += xPas) {
        let px = laPixelX(gx);
        ctx.fillText(etichetaRotunjita(gx), px, sus + plotInaltime + 14);
    }

    ctx.textAlign = "right";
    for (let gy = yGridStart; gy <= yMax; gy += yPas) {
        let py = laPixelY(gy);
        ctx.fillText(etichetaRotunjita(gy), stanga - 5, py + 3);
    }

    // Traseul functiei
    ctx.strokeStyle = "#0000cc";
    ctx.lineWidth = 2;
    ctx.beginPath();
    let startPornit = false;
    
    for (let i = 0; i <= numarPuncte; i++) {
        let xi = xMin + i * dx;
        let yi = fn(xi);
        if (!isFinite(yi)) {
            startPornit = false;
            continue;
        }
        let px = laPixelX(xi);
        let py = laPixelY(yi);
        if (!startPornit) {
            ctx.moveTo(px, py);
            startPornit = true;
        } else {
            ctx.lineTo(px, py);
        }
    }
    ctx.stroke();

    // Desenez iteratiile (daca exista)
    if (iteratii && iteratii.length > 0) {
        let total = iteratii.length;

        if (metoda === "Coarde") {
            // Arat doar cateva iteratii pentru coarde
            let indici = [0, 1, 2, Math.floor(total / 2), total - 2, total - 1];
            let culori = ["#888888", "#aa6600", "#cc4400", "#dd2200", "#cc0000"];

            for (let idx of indici) {
                if (idx >= 0 && idx < total) {
                    let iter = iteratii[idx];
                    let ai = iter.a;
                    let bi = iter.b;
                    let xi = iter.x;
                    let fai = fn(ai);
                    let fbi = fn(bi);
                    let fxi = fn(xi);

                    let culoareIdx = Math.min(idx, culori.length - 1);
                    let eUltima = idx === total - 1;

                    // Linia coardei
                    ctx.strokeStyle = culori[culoareIdx];
                    ctx.lineWidth = 1.5;
                    ctx.setLineDash([6, 3]);

                    let pxA = laPixelX(ai);
                    let pyA = laPixelY(fai);
                    let pxB = laPixelX(bi);
                    let pyB = laPixelY(fbi);

                    ctx.beginPath();
                    ctx.moveTo(pxA, pyA);
                    ctx.lineTo(pxB, pyB);
                    ctx.stroke();
                    ctx.setLineDash([]);

                    // Punctele capat
                    ctx.fillStyle = "#333333";
                    ctx.beginPath();
                    ctx.arc(pxA, pyA, 4, 0, 2 * Math.PI);
                    ctx.fill();
                    ctx.beginPath();
                    ctx.arc(pxB, pyB, 4, 0, 2 * Math.PI);
                    ctx.fill();

                    // Linie verticala si punct pe axa
                    if (yMin <= 0 && yMax >= 0) {
                        let pxXi = laPixelX(xi);
                        let y0px = laPixelY(0);

                        ctx.strokeStyle = "#aaaaaa";
                        ctx.lineWidth = 0.8;
                        ctx.setLineDash([3, 3]);
                        ctx.beginPath();
                        ctx.moveTo(pxXi, y0px);
                        ctx.lineTo(pxXi, laPixelY(fxi));
                        ctx.stroke();
                        ctx.setLineDash([]);

                        // Punctul pe axa
                        ctx.fillStyle = eUltima ? "#cc0000" : "#555555";
                        ctx.beginPath();
                        ctx.arc(pxXi, y0px, eUltima ? 6 : 4, 0, 2 * Math.PI);
                        ctx.fill();

                        // Eticheta
                        let label = "x" + iter.k;
                        let labelX = pxXi + 5;
                        let labelY = y0px + 15;
                        if (idx % 2 === 1) labelY = y0px - 8;

                        ctx.font = "bold 11px Arial";
                        let textW = ctx.measureText(label).width;
                        ctx.fillStyle = "rgba(255,255,255,0.9)";
                        ctx.fillRect(labelX - 2, labelY - 11, textW + 4, 14);
                        ctx.fillStyle = eUltima ? "#cc0000" : "#555555";
                        ctx.textAlign = "left";
                        ctx.fillText(label, labelX, labelY);
                    }
                }
            }
        } else {
            // Pentru bisectie
            let indici = [0, 1, 2, Math.floor(total / 2), total - 2, total - 1];
            let culori = ["#888888", "#aa6600", "#cc4400", "#dd2200", "#cc0000"];

            for (let si = 0; si < indici.length; si++) {
                let idx = indici[si];
                if (idx < 0 || idx >= total) continue;

                let iter = iteratii[idx];
                let ai = iter.a;
                let bi = iter.b;
                let xi = iter.x;
                let fai = fn(ai);
                let fbi = fn(bi);
                let fxi = fn(xi);
                let eUltima = idx === total - 1;
                let culoareIdx = Math.min(si, culori.length - 1);

                let pxA = laPixelX(ai);
                let pxB = laPixelX(bi);
                let pxMijloc = laPixelX(xi);

                // Linii punctate la capete
                ctx.strokeStyle = culori[culoareIdx];
                ctx.lineWidth = 1;
                ctx.setLineDash([5, 4]);

                if (isFinite(fai)) {
                    ctx.beginPath();
                    ctx.moveTo(pxA, laPixelY(0));
                    ctx.lineTo(pxA, laPixelY(fai));
                    ctx.stroke();
                }
                if (isFinite(fbi)) {
                    ctx.beginPath();
                    ctx.moveTo(pxB, laPixelY(0));
                    ctx.lineTo(pxB, laPixelY(fbi));
                    ctx.stroke();
                }
                ctx.setLineDash([]);

                // Punctele pe curba
                ctx.fillStyle = "#333333";
                if (isFinite(fai)) {
                    ctx.beginPath();
                    ctx.arc(pxA, laPixelY(fai), 3, 0, 2 * Math.PI);
                    ctx.fill();
                }
                if (isFinite(fbi)) {
                    ctx.beginPath();
                    ctx.arc(pxB, laPixelY(fbi), 3, 0, 2 * Math.PI);
                    ctx.fill();
                }

                // Linie verticala la mijloc
                if (isFinite(fxi)) {
                    ctx.strokeStyle = culori[culoareIdx];
                    ctx.lineWidth = 1.2;
                    ctx.setLineDash([3, 3]);
                    ctx.beginPath();
                    ctx.moveTo(pxMijloc, laPixelY(0));
                    ctx.lineTo(pxMijloc, laPixelY(fxi));
                    ctx.stroke();
                    ctx.setLineDash([]);

                    // Punct pe axa
                    ctx.fillStyle = eUltima ? "#cc0000" : "#ff8800";
                    ctx.beginPath();
                    ctx.arc(pxMijloc, laPixelY(0), eUltima ? 6 : 4, 0, 2 * Math.PI);
                    ctx.fill();

                    // Eticheta
                    let label = "c" + iter.k;
                    let labelX = pxMijloc + 5;
                    let labelY = laPixelY(0) + 15;
                    if (si % 2 === 1) labelY = laPixelY(0) - 8;

                    ctx.font = "bold 11px Arial";
                    let textW = ctx.measureText(label).width;
                    ctx.fillStyle = "rgba(255,255,255,0.9)";
                    ctx.fillRect(labelX - 2, labelY - 11, textW + 4, 14);
                    ctx.fillStyle = eUltima ? "#cc0000" : "#ff8800";
                    ctx.textAlign = "left";
                    ctx.fillText(label, labelX, labelY);

                    // Punct pe curba
                    ctx.fillStyle = eUltima ? "#cc0000" : "#ff8800";
                    ctx.beginPath();
                    ctx.arc(pxMijloc, laPixelY(fxi), eUltima ? 7 : 4, 0, 2 * Math.PI);
                    ctx.fill();
                    ctx.strokeStyle = "#ffffff";
                    ctx.lineWidth = 1.5;
                    ctx.stroke();
                }
            }
        }
    }

    // Marchez radacina finala
    if (radacini && radacini.length > 0) {
        let xr = radacini[0];
        let yr = fn(xr);
        let px = laPixelX(xr);
        let py = laPixelY(yr);

        ctx.fillStyle = "#cc0000";
        ctx.beginPath();
        ctx.arc(px, py, 8, 0, 2 * Math.PI);
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.font = "bold 12px Arial";
        ctx.fillStyle = "#cc0000";
        ctx.textAlign = "center";
        let precizieRoot = precizie || 6;
        ctx.fillText("Radacina ≈ " + xr.toFixed(precizieRoot), px, py - 15);
    }
}

// **********************************************************
// FUNCTII PENTRU TABEL
// **********************************************************

// Formateaza valorile pt tabel
function formateazaFx(val) {
    let absVal = Math.abs(val);
    if (absVal === 0) return "0";
    if (absVal >= 1) return val.toFixed(6);
    if (absVal >= 0.001) return val.toFixed(8);
    if (absVal >= 0.000001) return val.toFixed(10);
    return val.toFixed(12);
}

// Afiseaza rezultatele in tabel
function afiseazaRezultate(result, precizie) {
    tabelBody.innerHTML = "";

    if (result.error) {
        let tr = document.createElement("tr");
        let td = document.createElement("td");
        td.colSpan = 4;
        td.textContent = "Eroare: " + result.error;
        td.style.color = "red";
        td.style.whiteSpace = "pre-wrap";
        tr.appendChild(td);
        tabelBody.appendChild(tr);
        return;
    }

    // Adaug cate un rand pt fiecare iteratie
    for (let i = 0; i < result.iteratii.length; i++) {
        let iter = result.iteratii[i];
        let tr = document.createElement("tr");

        let tdX = document.createElement("td");
        let tdFx = document.createElement("td");
        let tdK = document.createElement("td");
        let tdT = document.createElement("td");

        tdX.textContent = iter.x.toFixed(7);
        tdFx.textContent = formateazaFx(iter.fx);
        tdK.textContent = iter.k;
        tdT.textContent = iter.timp.toFixed(2) + " ms";

        tr.appendChild(tdX);
        tr.appendChild(tdFx);
        tr.appendChild(tdK);
        tr.appendChild(tdT);
        tabelBody.appendChild(tr);

        // Evidentiez ultima iteratie
        if (i === result.iteratii.length - 1) {
            tr.style.backgroundColor = "#ffe0e0";
            tr.style.fontWeight = "bold";
        }
    }
}

// **********************************************************
// LOGICA PENTRU MODUL DE LUCRU
// **********************************************************

// Asculta schimbarea la radio buttons
radioInteractiv.addEventListener("change", function() {
    if (this.checked) {
        selectFunctie.disabled = true;
        campFunctie.disabled = false;
    }
});

radioCollectie.addEventListener("change", function() {
    if (this.checked) {
        selectFunctie.disabled = false;
        campFunctie.disabled = true;
    }
});

// Initial setari
radioInteractiv.checked = true;
selectFunctie.disabled = true;
campFunctie.disabled = false;

// **********************************************************
// BUTONUL DE EXECUTARE
// **********************************************************

butonExecuta.addEventListener("click", function() {
    // Determin expresia functiei
    let expr;
    if (radioInteractiv.checked) {
        expr = campFunctie.value.trim();
    } else {
        expr = selectFunctie.value;
        if (expr === "Selectați funcția") {
            alert("Selecteaza o functie din colectie!");
            return;
        }
    }

    let a = parseFloat(inputA.value);
    let b = parseFloat(inputB.value);
    let epsValoare = parseInt(epsInput.value);
    if (isNaN(epsValoare) || epsValoare < 1) epsValoare = 6;
    let eps = Math.pow(10, -epsValoare);
    let metoda = selectMetoda.value;

    // Validari
    if (!expr) {
        alert("Introdu o functie f(x)!");
        return;
    }
    if (isNaN(a) || isNaN(b)) {
        alert("Introdu a si b!");
        return;
    }
    if (a >= b) {
        alert("a trebuie sa fie mai mic decat b!");
        return;
    }

    // Construiesc functia
    let fn = construiesteFunctie(expr);
    if (!fn) return;

    // Desenez graficul initial
    deseneazaGrafic(fn, a, b, [], [], null, epsValoare);

    // Aleg metoda
    if (metoda === "Bisection") {
        // Apelez functia din bisection.js
        if (typeof bisection === 'function') {
            let result = bisection(fn, a, b, eps);
            afiseazaRezultate(result, epsValoare);
            deseneazaGrafic(fn, a, b, [result.radacina], result.iteratii, null, epsValoare);
        } else {
            alert("Fisierul bisection.js nu e incarcat sau nu contine functia bisection!");
        }
        
    } else if (metoda === "Coarde") {
        // Apelez functia din coarde.js
        if (typeof chords === 'function') {
            let result = chords(fn, a, b, eps);
            afiseazaRezultate(result, epsValoare);
            deseneazaGrafic(fn, a, b, [result.radacina], result.iteratii, "Coarde", epsValoare);
        } else {
            alert("Fisierul coarde.js nu e incarcat sau nu contine functia chords!");
        }
        
    } else if (metoda === "Newton" || metoda === "Secant") {
        alert("Metoda " + metoda + " nu e implementata inca.");
    } else {
        alert("Selecteaza o metoda!");
    }
});

// **********************************************************
// REDIMENSIONARE CANVAS
// **********************************************************

window.addEventListener("load", function() {
    let expr;
    if (radioInteractiv.checked) {
        expr = campFunctie.value.trim();
    } else {
        expr = selectFunctie.value;
    }
    
    if (expr && expr !== "Selectați funcția") {
        let fn = construiesteFunctie(expr);
        if (fn) {
            let a = parseFloat(inputA.value);
            let b = parseFloat(inputB.value);
            let epsValoare = parseInt(epsInput.value) || 6;
            deseneazaGrafic(fn, a, b, [], [], null, epsValoare);
        }
    }
});

window.addEventListener("resize", function() {
    let expr;
    if (radioInteractiv.checked) {
        expr = campFunctie.value.trim();
    } else {
        expr = selectFunctie.value;
    }
    
    if (expr && expr !== "Selectați funcția") {
        let fn = construiesteFunctie(expr);
        if (fn) {
            let a = parseFloat(inputA.value);
            let b = parseFloat(inputB.value);
            let epsValoare = parseInt(epsInput.value) || 6;
            deseneazaGrafic(fn, a, b, [], [], null, epsValoare);
        }
    }
});