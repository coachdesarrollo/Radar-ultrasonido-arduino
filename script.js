const canvas = document.getElementById("radarCanvas");
const ctx = canvas.getContext("2d");
const angulo = document.getElementById("angulo");
const distancia = document.getElementById("distancia");
let width, height;

let iAngle = 0;
let iDistance = 0;

document.getElementById("codigoArduino").addEventListener("click", () => {
    alert(`Para que el radar funcione correctamente, tu Arduino debe imprimir los datos en este formato:
    Serial.print(angulo_entero);
    Serial.print(",");
    Serial.print(distancia_entera);
    Serial.print(".");

Ejemplo:
    90,27.

Donde:
    1. El ángulo es un valor entre 0° y 180°
    2. La distancia es el valor medido en centímetros
    3. Se separan por una coma (,) ambos valores
    4. Cada lectura termina con un punto (.)`);
});

function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    width = canvas.width;
    height = canvas.height;
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);

function draw() {
    ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
    ctx.fillRect(0, 0, width, height);

    drawRadar();
    drawLine();
    drawObject();
    drawText();

    requestAnimationFrame(draw);
}

function drawRadar() {
    ctx.save();
    ctx.translate(width / 2, height - height * 0.074);
    ctx.strokeStyle = "#62f51f";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let r of [0.2,0.4,0.6,0.8,1]) {
        ctx.arc(0, 0, (width * r) / 2, Math.PI, 2 * Math.PI);
    }
    ctx.stroke();
    ctx.beginPath();
    for (let a = 30; a <= 150; a += 30) {
        let rad = (a * Math.PI) / 180;
        ctx.moveTo(0, 0);
        ctx.lineTo(-(width / 2) * Math.cos(rad), -(width / 2) * Math.sin(rad));
    }
    ctx.moveTo(-width / 2, 0);
    ctx.lineTo(width / 2, 0);
    ctx.stroke();
    ctx.restore();
}

function drawLine() {
    ctx.save();
    ctx.translate(width / 2, height - height * 0.074);
    ctx.strokeStyle = "#1efc3c";
    ctx.lineWidth = 3;
    ctx.beginPath();
    let rad = (iAngle * Math.PI) / 180;
    ctx.moveTo(0, 0);
    ctx.lineTo(
        (height - height * 0.12) * Math.cos(rad),
        -(height - height * 0.12) * Math.sin(rad)
    );
    ctx.stroke();
    ctx.restore();
}

function drawObject() {
    if (iDistance >= 40) return;
    ctx.save();
    ctx.translate(width / 2, height - height * 0.074);
    ctx.strokeStyle = "#ff0a0a";
    ctx.lineWidth = 5;
    let rad = (iAngle * Math.PI) / 180;
    let dist = iDistance * ((height - height * 0.1666) * 0.025);
    ctx.beginPath();
    ctx.moveTo(dist * Math.cos(rad), -dist * Math.sin(rad));
    ctx.lineTo(
        (width - width * 0.505) * Math.cos(rad),
        -(width - width * 0.505) * Math.sin(rad)
    );
    ctx.stroke();
    ctx.restore();
}

function drawText() {
    angulo.textContent = `${iAngle}°`;
    distancia.textContent = iDistance >= 40 ? `+40cm` : `${iDistance}cm`;
}

draw();

async function connectSerial() {
    try {
        const port = await navigator.serial.requestPort();
        await port.open({ baudRate: 9600 });

        const decoder = new TextDecoderStream();
        const inputDone = port.readable.pipeTo(decoder.writable);
        const inputStream = decoder.readable;
        const reader = inputStream.getReader();

        let buffer = "";

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            if (value) {
                buffer += value;
                let parts = buffer.split(".");
                if (parts.length > 1) {
                    for (let i = 0; i < parts.length - 1; i++) {
                        const data = parts[i];
                        const [angle, distance] = data.split(",");
                        iAngle = parseInt(angle.trim());
                        iDistance = parseInt(distance.trim());
                    }
                    buffer = parts[parts.length - 1];
                }
            }
        }
    } catch (err) {
        alert("Error al conectar el puerto serial");
        console.error(err)
    }
}
