import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';
import { CanvasElement, CanvasPage, CanvasProject, ShapeType } from '../types/canvas';

// Helper to load image
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

// Generate QR Code data URL
export async function generateQrDataUrl(text: string, fgColor = '#000000', bgColor = '#FFFFFF'): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      color: { dark: fgColor, light: bgColor },
      margin: 1,
      width: 400,
    });
  } catch (err) {
    console.error('QR code generation failed:', err);
    return '';
  }
}

// Draw shape paths
function drawShapePath(ctx: CanvasRenderingContext2D, type: ShapeType, w: number, h: number, radius = 0) {
  ctx.beginPath();
  switch (type) {
    case 'rectangle':
    case 'rounded-rect': {
      const r = Math.min(radius, w / 2, h / 2);
      if (r > 0) {
        ctx.roundRect(0, 0, w, h, r);
      } else {
        ctx.rect(0, 0, w, h);
      }
      break;
    }
    case 'circle': {
      ctx.ellipse(w / 2, h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
      break;
    }
    case 'triangle': {
      ctx.moveTo(w / 2, 0);
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      break;
    }
    case 'diamond': {
      ctx.moveTo(w / 2, 0);
      ctx.lineTo(w, h / 2);
      ctx.lineTo(w / 2, h);
      ctx.lineTo(0, h / 2);
      ctx.closePath();
      break;
    }
    case 'star': {
      const spikes = 5;
      const outerR = Math.min(w, h) / 2;
      const innerR = outerR * 0.42;
      const cx = w / 2;
      const cy = h / 2;
      let rot = (Math.PI / 2) * 3;
      const step = Math.PI / spikes;

      ctx.moveTo(cx, cy - outerR);
      for (let i = 0; i < spikes; i++) {
        let x = cx + Math.cos(rot) * outerR;
        let y = cy + Math.sin(rot) * outerR;
        ctx.lineTo(x, y);
        rot += step;

        x = cx + Math.cos(rot) * innerR;
        y = cy + Math.sin(rot) * innerR;
        ctx.lineTo(x, y);
        rot += step;
      }
      ctx.lineTo(cx, cy - outerR);
      ctx.closePath();
      break;
    }
    case 'badge': {
      const points = 12;
      const outer = Math.min(w, h) / 2;
      const inner = outer * 0.82;
      const cx = w / 2;
      const cy = h / 2;
      const step = Math.PI / points;
      let rot = 0;

      ctx.moveTo(cx + outer, cy);
      for (let i = 0; i < points * 2; i++) {
        const r = i % 2 === 0 ? outer : inner;
        const x = cx + Math.cos(rot) * r;
        const y = cy + Math.sin(rot) * r;
        ctx.lineTo(x, y);
        rot += step;
      }
      ctx.closePath();
      break;
    }
    case 'heart': {
      const topCurveHeight = h * 0.3;
      ctx.moveTo(w / 2, h / 5);
      ctx.bezierCurveTo(w / 2, 0, 0, 0, 0, topCurveHeight);
      ctx.bezierCurveTo(0, (h + topCurveHeight) / 2, w / 2, (h + topCurveHeight) / 1.5, w / 2, h);
      ctx.bezierCurveTo(w / 2, (h + topCurveHeight) / 1.5, w, (h + topCurveHeight) / 2, w, topCurveHeight);
      ctx.bezierCurveTo(w, 0, w / 2, 0, w / 2, h / 5);
      ctx.closePath();
      break;
    }
    case 'arrow': {
      const headW = w * 0.35;
      const shaftH = h * 0.35;
      const shaftY = (h - shaftH) / 2;

      ctx.moveTo(0, shaftY);
      ctx.lineTo(w - headW, shaftY);
      ctx.lineTo(w - headW, 0);
      ctx.lineTo(w, h / 2);
      ctx.lineTo(w - headW, h);
      ctx.lineTo(w - headW, shaftY + shaftH);
      ctx.lineTo(0, shaftY + shaftH);
      ctx.closePath();
      break;
    }
    case 'speech-bubble': {
      const r = Math.min(16, w / 4, h / 4);
      const tailW = Math.min(24, w * 0.2);
      const tailH = Math.min(20, h * 0.2);
      const bodyH = h - tailH;

      ctx.moveTo(r, 0);
      ctx.lineTo(w - r, 0);
      ctx.quadraticCurveTo(w, 0, w, r);
      ctx.lineTo(w, bodyH - r);
      ctx.quadraticCurveTo(w, bodyH, w - r, bodyH);
      ctx.lineTo(w * 0.4 + tailW, bodyH);
      ctx.lineTo(w * 0.35, h);
      ctx.lineTo(w * 0.4, bodyH);
      ctx.lineTo(r, bodyH);
      ctx.quadraticCurveTo(0, bodyH, 0, bodyH - r);
      ctx.lineTo(0, r);
      ctx.quadraticCurveTo(0, 0, r, 0);
      ctx.closePath();
      break;
    }
  }
}

// Render an entire page onto an HTML5 Canvas element
export async function renderPageToCanvas(
  page: CanvasPage,
  width: number,
  height: number,
  scale: number = 1
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2d context');

  ctx.scale(scale, scale);

  // 1. Draw Page Background
  ctx.save();
  if (page.backgroundColor) {
    ctx.fillStyle = page.backgroundColor;
    ctx.fillRect(0, 0, width, height);
  } else {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);
  }

  if (page.backgroundImage) {
    try {
      const bgImg = await loadImage(page.backgroundImage);
      ctx.drawImage(bgImg, 0, 0, width, height);
    } catch (e) {
      console.warn('Could not load background image:', e);
    }
  }
  ctx.restore();

  // Sort elements by zIndex
  const sorted = [...page.elements].sort((a, b) => a.zIndex - b.zIndex);

  // 2. Draw Elements
  for (const el of sorted) {
    if (el.hidden) continue;

    ctx.save();
    ctx.globalAlpha = el.opacity ?? 1;

    // Translation & Rotation around element center
    const cx = el.x + el.width / 2;
    const cy = el.y + el.height / 2;
    ctx.translate(cx, cy);
    if (el.rotation) {
      ctx.rotate((el.rotation * Math.PI) / 180);
    }

    // Shadow
    if (el.shadow) {
      ctx.shadowColor = el.shadow.color;
      ctx.shadowBlur = el.shadow.blur;
      ctx.shadowOffsetX = el.shadow.offsetX;
      ctx.shadowOffsetY = el.shadow.offsetY;
    }

    const localX = -el.width / 2;
    const localY = -el.height / 2;

    if (el.type === 'shape' && el.shapeType) {
      ctx.translate(localX, localY);
      drawShapePath(ctx, el.shapeType, el.width, el.height, el.borderRadius ?? 0);

      // Fill
      if (el.fillColor) {
        ctx.fillStyle = el.fillColor;
        ctx.fill();
      }

      // Stroke
      if (el.strokeColor && el.strokeWidth && el.strokeWidth > 0) {
        ctx.strokeStyle = el.strokeColor;
        ctx.lineWidth = el.strokeWidth;
        ctx.stroke();
      }
    } else if (el.type === 'text') {
      ctx.translate(localX, localY);

      const fontSize = el.fontSize || 24;
      const fontWeight = el.fontWeight || '400';
      const fontStyle = el.fontStyle || 'normal';
      const fontFamily = el.fontFamily || "'Plus Jakarta Sans', sans-serif";

      ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
      if ('letterSpacing' in ctx && el.letterSpacing) {
        (ctx as any).letterSpacing = `${el.letterSpacing}px`;
      }

      // Optional background pill for text
      if (el.backgroundColor) {
        ctx.fillStyle = el.backgroundColor;
        const padX = 12;
        const padY = 6;
        ctx.fillRect(-padX, -padY, el.width + padX * 2, el.height + padY * 2);
      }

      ctx.fillStyle = el.color || '#000000';
      ctx.textBaseline = 'top';

      const align = el.textAlign || 'left';
      ctx.textAlign = align;

      let drawX = 0;
      if (align === 'center') drawX = el.width / 2;
      if (align === 'right') drawX = el.width;

      const lines = (el.text || '').split('\n');
      const lineH = (el.lineHeight || 1.3) * fontSize;

      lines.forEach((line, idx) => {
        let printText = line;
        if (el.textTransform === 'uppercase') printText = line.toUpperCase();
        if (el.textTransform === 'lowercase') printText = line.toLowerCase();

        ctx.fillText(printText, drawX, idx * lineH);

        if (el.strokeColor && el.strokeWidth && el.strokeWidth > 0) {
          ctx.strokeStyle = el.strokeColor;
          ctx.lineWidth = el.strokeWidth;
          ctx.strokeText(printText, drawX, idx * lineH);
        }

        if (el.textDecoration === 'underline') {
          const textW = ctx.measureText(printText).width;
          const uY = idx * lineH + fontSize + 2;
          ctx.beginPath();
          ctx.moveTo(align === 'center' ? drawX - textW / 2 : drawX, uY);
          ctx.lineTo(align === 'center' ? drawX + textW / 2 : drawX + textW, uY);
          ctx.lineWidth = Math.max(1, fontSize / 16);
          ctx.strokeStyle = el.color || '#000000';
          ctx.stroke();
        }
      });
    } else if (el.type === 'image' && el.src) {
      try {
        const img = await loadImage(el.src);
        ctx.translate(localX, localY);

        if (el.borderRadius && el.borderRadius > 0) {
          ctx.beginPath();
          ctx.roundRect(0, 0, el.width, el.height, el.borderRadius);
          ctx.clip();
        }

        // Filters
        if (el.filters) {
          const { brightness, contrast, saturation, grayscale, blur, sepia } = el.filters;
          ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) grayscale(${grayscale}%) blur(${blur}px) sepia(${sepia}%)`;
        }

        // Flips
        if (el.flipX || el.flipY) {
          ctx.translate(el.flipX ? el.width : 0, el.flipY ? el.height : 0);
          ctx.scale(el.flipX ? -1 : 1, el.flipY ? -1 : 1);
        }

        ctx.drawImage(img, 0, 0, el.width, el.height);
      } catch (err) {
        console.warn('Failed to render image on canvas:', err);
      }
    } else if (el.type === 'qrcode' && el.qrText) {
      try {
        const qrUrl = await generateQrDataUrl(el.qrText, el.fgColor, el.bgColor);
        const qrImg = await loadImage(qrUrl);
        ctx.translate(localX, localY);
        ctx.drawImage(qrImg, 0, 0, el.width, el.height);
      } catch (err) {
        console.warn('Failed to render QR code:', err);
      }
    } else if (el.type === 'icon') {
      ctx.translate(localX, localY);
      // Draw stylized placeholder icon frame
      ctx.fillStyle = el.color || '#6366F1';
      ctx.beginPath();
      ctx.arc(el.width / 2, el.height / 2, Math.min(el.width, el.height) / 2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  return canvas;
}

// Download image as file
export function triggerDownload(dataUrl: string, filename: string) {
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Export single page to PNG or JPEG
export async function exportPageAsImage(
  page: CanvasPage,
  width: number,
  height: number,
  format: 'png' | 'jpeg',
  scale: number = 2,
  quality: number = 0.95,
  filename?: string
): Promise<void> {
  const canvas = await renderPageToCanvas(page, width, height, scale);
  const mime = format === 'jpeg' ? 'image/jpeg' : 'image/png';
  const dataUrl = canvas.toDataURL(mime, quality);
  triggerDownload(dataUrl, filename || `design-${page.name.toLowerCase().replace(/\s+/g, '-')}.${format}`);
}

// Export multi-page or single page to PDF
export async function exportProjectAsPdf(
  project: CanvasProject,
  pageIndex: number | 'all' = 'all',
  filename?: string
): Promise<void> {
  const pagesToExport = pageIndex === 'all' 
    ? project.pages 
    : [project.pages[pageIndex] || project.pages[0]];

  const isLandscape = project.width > project.height;
  const pdf = new jsPDF({
    orientation: isLandscape ? 'landscape' : 'portrait',
    unit: 'pt',
    format: [project.width, project.height],
  });

  for (let i = 0; i < pagesToExport.length; i++) {
    const page = pagesToExport[i];
    if (i > 0) {
      pdf.addPage([project.width, project.height], isLandscape ? 'landscape' : 'portrait');
    }

    const canvas = await renderPageToCanvas(page, project.width, project.height, 2);
    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    pdf.addImage(imgData, 'JPEG', 0, 0, project.width, project.height);
  }

  pdf.save(filename || `${project.title.toLowerCase().replace(/\s+/g, '-')}.pdf`);
}

// Export project file as JSON
export function exportProjectJson(project: CanvasProject) {
  const data = JSON.stringify(project, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  triggerDownload(url, `${project.title.toLowerCase().replace(/\s+/g, '-')}-project.json`);
  URL.revokeObjectURL(url);
}

// Import project from uploaded JSON file
export function importProjectFromFile(file: File): Promise<CanvasProject> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text) as CanvasProject;
        if (parsed && Array.isArray(parsed.pages) && parsed.pages.length > 0) {
          resolve(parsed);
        } else {
          reject(new Error('Invalid design file structure. Must contain page layers.'));
        }
      } catch (err) {
        reject(new Error('Corrupted JSON file. Could not parse project data.'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read project file'));
    reader.readAsText(file);
  });
}
