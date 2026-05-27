import { describe, it, expect } from 'vitest';
import { designTokens, primaryColors, mauBallColors, warmGray, semanticColors, gradients } from '@/styles/design-system/colors';
import { typographyTokens, fontFamily, fontSize, fontWeight, headingStyles, textStyles } from '@/styles/design-system/typography';
import { componentTokens, buttonTokens, cardTokens, inputTokens } from '@/styles/design-system/components';
import { motionTokens, springAnimation, duration, easing, shadows, borderRadius, spacing, zIndex } from '@/styles/design-system/motion';

describe('Design System Styles', () => {
  describe('Colors', () => {
    it('should have all required color palettes in designTokens', () => {
      expect(designTokens.colors.orange).toBeDefined();
      expect(designTokens.colors.red).toBeDefined();
      expect(designTokens.colors.green).toBeDefined();
      expect(designTokens.colors.purple).toBeDefined();
      expect(designTokens.colors.blue).toBeDefined();
      expect(designTokens.colors.yellow).toBeDefined();
      expect(designTokens.colors.pink).toBeDefined();
      expect(designTokens.colors.warmGray).toBeDefined();
      expect(designTokens.colors.semantic).toBeDefined();
      expect(designTokens.colors.gradient).toBeDefined();
    });

    it('should have primary color variants', () => {
      expect(primaryColors.orange[50]).toBeDefined();
      expect(primaryColors.orange[100]).toBeDefined();
      expect(primaryColors.orange[200]).toBeDefined();
      expect(primaryColors.orange[300]).toBeDefined();
      expect(primaryColors.orange[400]).toBeDefined();
      expect(primaryColors.orange[500]).toBeDefined();
      expect(primaryColors.orange[600]).toBeDefined();
      expect(primaryColors.orange[700]).toBeDefined();
      expect(primaryColors.orange[800]).toBeDefined();
      expect(primaryColors.orange[900]).toBeDefined();
    });

    it('should have mauBall color variants', () => {
      expect(mauBallColors.purple[50]).toBeDefined();
      expect(mauBallColors.blue[50]).toBeDefined();
      expect(mauBallColors.yellow[50]).toBeDefined();
      expect(mauBallColors.pink[50]).toBeDefined();
    });

    it('should have warmGray color variants', () => {
      expect(warmGray[0]).toBeDefined();
      expect(warmGray[50]).toBeDefined();
      expect(warmGray[100]).toBeDefined();
      expect(warmGray[200]).toBeDefined();
      expect(warmGray[400]).toBeDefined();
      expect(warmGray[600]).toBeDefined();
      expect(warmGray[800]).toBeDefined();
      expect(warmGray[900]).toBeDefined();
    });

    it('should have semantic colors', () => {
      expect(semanticColors.health).toBeDefined();
      expect(semanticColors.alert).toBeDefined();
      expect(semanticColors.petType).toBeDefined();
      expect(semanticColors.module).toBeDefined();
    });

    it('should have gradient definitions', () => {
      expect(gradients.primary).toBeDefined();
      expect(gradients.mauBall).toBeDefined();
      expect(gradients.health).toBeDefined();
      expect(gradients.warning).toBeDefined();
      expect(gradients.dark).toBeDefined();
    });

    it('should have opacity values', () => {
      expect(designTokens.opacity).toBeDefined();
      expect(designTokens.opacity[0]).toBe('0');
      expect(designTokens.opacity[100]).toBe('1');
    });
  });

  describe('Typography', () => {
    it('should have font families defined', () => {
      expect(fontFamily.primary).toBeDefined();
      expect(fontFamily.numeric).toBeDefined();
      expect(fontFamily.mono).toBeDefined();
    });

    it('should have font sizes defined', () => {
      expect(fontSize.xs).toBeDefined();
      expect(fontSize.sm).toBeDefined();
      expect(fontSize.base).toBeDefined();
      expect(fontSize.lg).toBeDefined();
      expect(fontSize.xl).toBeDefined();
      expect(fontSize['2xl']).toBeDefined();
      expect(fontSize['3xl']).toBeDefined();
      expect(fontSize['4xl']).toBeDefined();
      expect(fontSize['5xl']).toBeDefined();
      expect(fontSize['6xl']).toBeDefined();
    });

    it('should have font weight values', () => {
      expect(fontWeight.hairline).toBe(100);
      expect(fontWeight.thin).toBe(200);
      expect(fontWeight.extralight).toBe(300);
      expect(fontWeight.light).toBe(400);
      expect(fontWeight.normal).toBe(500);
      expect(fontWeight.medium).toBe(600);
      expect(fontWeight.semibold).toBe(700);
      expect(fontWeight.bold).toBe(800);
      expect(fontWeight.extrabold).toBe(900);
    });

    it('should have heading styles', () => {
      expect(headingStyles.h1).toBeDefined();
      expect(headingStyles.h2).toBeDefined();
      expect(headingStyles.h3).toBeDefined();
      expect(headingStyles.h4).toBeDefined();
      expect(headingStyles.h5).toBeDefined();
      expect(headingStyles.h6).toBeDefined();
    });

    it('should have text styles', () => {
      expect(textStyles.body).toBeDefined();
      expect(textStyles.secondary).toBeDefined();
      expect(textStyles.hint).toBeDefined();
      expect(textStyles.emphasis).toBeDefined();
      expect(textStyles.numeric).toBeDefined();
      expect(textStyles.code).toBeDefined();
    });

    it('should have responsive font sizes', () => {
      expect(typographyTokens.responsiveFontSize).toBeDefined();
      expect(typographyTokens.responsiveFontSize.mobile).toBeDefined();
      expect(typographyTokens.responsiveFontSize.tablet).toBeDefined();
      expect(typographyTokens.responsiveFontSize.desktop).toBeDefined();
    });
  });

  describe('Components', () => {
    it('should have button tokens', () => {
      expect(buttonTokens.size).toBeDefined();
      expect(buttonTokens.variant).toBeDefined();
      expect(buttonTokens.iconGap).toBeDefined();
    });

    it('should have card tokens', () => {
      expect(cardTokens.size).toBeDefined();
      expect(cardTokens.variant).toBeDefined();
    });

    it('should have input tokens', () => {
      expect(inputTokens.size).toBeDefined();
      expect(inputTokens.state).toBeDefined();
    });

    it('should have navbar tokens', () => {
      expect(componentTokens.navbar).toBeDefined();
      expect(componentTokens.navbar.bottom).toBeDefined();
      expect(componentTokens.navbar.top).toBeDefined();
    });

    it('should have modal tokens', () => {
      expect(componentTokens.modal).toBeDefined();
      expect(componentTokens.modal.size).toBeDefined();
      expect(componentTokens.modal.variant).toBeDefined();
    });
  });

  describe('Motion', () => {
    it('should have spring animations', () => {
      expect(springAnimation.standard).toBeDefined();
      expect(springAnimation.gentle).toBeDefined();
      expect(springAnimation.bouncy).toBeDefined();
      expect(springAnimation.stiff).toBeDefined();
      expect(springAnimation.soft).toBeDefined();
    });

    it('should have durations', () => {
      expect(duration.instant).toBe(100);
      expect(duration.fast).toBe(150);
      expect(duration.normal).toBe(200);
      expect(duration.moderate).toBe(300);
      expect(duration.slow).toBe(400);
      expect(duration.slower).toBe(500);
      expect(duration.slowest).toBe(800);
    });

    it('should have easing functions', () => {
      expect(easing.standard).toBeDefined();
      expect(easing.enter).toBeDefined();
      expect(easing.exit).toBeDefined();
      expect(easing.spring).toBeDefined();
      expect(easing.bounce).toBeDefined();
      expect(easing.linear).toBeDefined();
    });

    it('should have shadows', () => {
      expect(shadows.xs).toBeDefined();
      expect(shadows.warm).toBeDefined();
      expect(shadows.glass).toBeDefined();
      expect(shadows.inner).toBeDefined();
      expect(shadows.breathe).toBeDefined();
    });

    it('should have border radii', () => {
      expect(borderRadius.xs).toBe('0.25rem');
      expect(borderRadius.sm).toBe('0.375rem');
      expect(borderRadius.md).toBe('0.75rem');
      expect(borderRadius.DEFAULT).toBe('1rem');
      expect(borderRadius.lg).toBe('1.5rem');
      expect(borderRadius.xl).toBe('2rem');
      expect(borderRadius.full).toBe('9999px');
    });

    it('should have spacing values', () => {
      expect(spacing[0]).toBe('0');
      expect(spacing[1]).toBe('0.25rem');
      expect(spacing[2]).toBe('0.5rem');
      expect(spacing[4]).toBe('1rem');
      expect(spacing[8]).toBe('2rem');
      expect(spacing[12]).toBe('3rem');
      expect(spacing[16]).toBe('4rem');
    });

    it('should have z-index values', () => {
      expect(zIndex.base).toBe(0);
      expect(zIndex.dropdown).toBe(1000);
      expect(zIndex.modal).toBe(4000);
      expect(zIndex.toast).toBe(7000);
    });

    it('should have glassmorphism', () => {
      expect(motionTokens.glassmorphism).toBeDefined();
      expect(motionTokens.glassmorphism.light).toBeDefined();
      expect(motionTokens.glassmorphism.medium).toBeDefined();
      expect(motionTokens.glassmorphism.heavy).toBeDefined();
    });

    it('should have presets', () => {
      expect(motionTokens.presets).toBeDefined();
      expect(motionTokens.presets.cardHover).toBeDefined();
      expect(motionTokens.presets.buttonPress).toBeDefined();
      expect(motionTokens.presets.pageEnter).toBeDefined();
    });
  });

  describe('Style Consistency', () => {
    it('should have consistent color format', () => {
      const checkColorFormat = (color: string) => {
        expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      };

      Object.values(primaryColors.orange).forEach(checkColorFormat);
      Object.values(warmGray).forEach(checkColorFormat);
    });

    it('should have consistent font size format', () => {
      Object.values(fontSize).forEach(size => {
        expect(size.size).toMatch(/^[\d.]+rem$/);
      });
    });
  });
});