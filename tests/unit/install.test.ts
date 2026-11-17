import { describe, expect, it } from 'vitest';
import { installMode, isIos, isIosSafari, isStandalone } from '../../src/pwa/install';

const IPHONE_SAFARI = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1';
const IPHONE_CHROME = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/124.0.0.0 Mobile/15E148 Safari/604.1';
const IPHONE_FIREFOX = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/124.0 Mobile/15E148 Safari/605.1.15';
const IPAD_DESKTOP = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15';
const ANDROID_CHROME = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36';
const MAC_SAFARI = IPAD_DESKTOP;
const none = () => false;

describe('detecção de iOS', () => {
 it('reconhece iPhone e iPad', () => {
  expect(isIos({ userAgent: IPHONE_SAFARI })).toBe(true);
  expect(isIos({ userAgent: 'Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X) Safari/604.1' })).toBe(true);
 });
 it('reconhece o iPadOS que se identifica como Mac, só com toque', () => {
  expect(isIos({ userAgent: IPAD_DESKTOP, platform: 'MacIntel', maxTouchPoints: 5 })).toBe(true);
  expect(isIos({ userAgent: MAC_SAFARI, platform: 'MacIntel', maxTouchPoints: 0 })).toBe(false);
 });
 it('não confunde Android nem desktop', () => {
  expect(isIos({ userAgent: ANDROID_CHROME, platform: 'Linux armv8l', maxTouchPoints: 5 })).toBe(false);
 });
 it('separa Safari dos outros navegadores do iOS', () => {
  expect(isIosSafari({ userAgent: IPHONE_SAFARI })).toBe(true);
  expect(isIosSafari({ userAgent: IPHONE_CHROME })).toBe(false);
  expect(isIosSafari({ userAgent: IPHONE_FIREFOX })).toBe(false);
  expect(isIosSafari({ userAgent: ANDROID_CHROME })).toBe(false);
 });
});

describe('app instalado', () => {
 it('usa navigator.standalone ou display-mode', () => {
  expect(isStandalone({ userAgent: IPHONE_SAFARI, standalone: true }, none)).toBe(true);
  expect(isStandalone({ userAgent: ANDROID_CHROME }, q => q === '(display-mode: standalone)')).toBe(true);
  expect(isStandalone({ userAgent: ANDROID_CHROME, standalone: false }, none)).toBe(false);
 });
});

describe('modo de instalação', () => {
 const base = { matches: none, hasPrompt: false };
 it('instalado vence tudo', () => {
  expect(installMode({ nav: { userAgent: IPHONE_SAFARI, standalone: true }, ...base, hasPrompt: true })).toBe('installed');
 });
 it('com evento guardado, instala direto', () => {
  expect(installMode({ nav: { userAgent: ANDROID_CHROME }, ...base, hasPrompt: true })).toBe('prompt');
 });
 it('iPhone no Safari e em outro navegador', () => {
  expect(installMode({ nav: { userAgent: IPHONE_SAFARI }, ...base })).toBe('ios-safari');
  expect(installMode({ nav: { userAgent: IPHONE_CHROME }, ...base })).toBe('ios-other');
 });
 it('sem suporte, instruções genéricas', () => {
  expect(installMode({ nav: { userAgent: ANDROID_CHROME }, ...base })).toBe('manual');
  expect(installMode({ nav: { userAgent: MAC_SAFARI, platform: 'MacIntel', maxTouchPoints: 0 }, ...base })).toBe('manual');
 });
});
