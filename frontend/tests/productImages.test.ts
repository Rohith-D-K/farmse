import { describe, it, expect } from 'vitest';
import { getImageForCrop, PRODUCT_IMAGES } from '../src/utils/productImages';

describe('getImageForCrop', () => {
    it('returns direct match for known crop', () => {
        expect(getImageForCrop('Tomato')).toBe('/produce/tomato.jpg');
    });

    it('returns case-insensitive match', () => {
        expect(getImageForCrop('tomato')).toBe('/produce/tomato.jpg');
        expect(getImageForCrop('TOMATO')).toBe('/produce/tomato.jpg');
    });

    it('returns partial match (e.g. "Fresh Tomato")', () => {
        expect(getImageForCrop('Fresh Tomato')).toBe('/produce/tomato.jpg');
    });

    it('returns default for unknown crop', () => {
        expect(getImageForCrop('DragonFruit')).toBe(PRODUCT_IMAGES['default']);
    });

    it('returns specific image for each known crop', () => {
        const knownCrops = [
            'Tomato', 'Spinach', 'Carrot', 'Okra', 'Cucumber',
            'Potato', 'Cauliflower', 'Cabbage', 'Chilli', 'Brinjal',
            'Beans', 'Beetroot', 'Apple', 'Banana', 'Orange',
            'Grapes', 'Strawberry', 'Watermelon', 'Lemon', 'Mosambi',
        ];
        for (const crop of knownCrops) {
            const img = getImageForCrop(crop);
            expect(img).not.toBe(PRODUCT_IMAGES['default']);
        }
    });

    it('Ladyfinger maps to okra image', () => {
        expect(getImageForCrop('Ladyfinger')).toBe('/produce/okra.jpg');
    });

    it('Eggplant maps to brinjal image', () => {
        expect(getImageForCrop('Eggplant')).toBe('/produce/brinjal.jpg');
    });
});
