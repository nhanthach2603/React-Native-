// d:\React-Native-\styles\pickingScreen.styles.ts

import { StyleSheet } from 'react-native';
import { COLORS } from './_colors';

export const pickingStyles = StyleSheet.create({
    itemContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 15, borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: '#EEE' },
    itemInfo: { flex: 1, marginLeft: 15 },
    itemName: { fontSize: 16, fontWeight: 'bold', color: COLORS.text_primary },
    itemVariant: { fontSize: 14, color: COLORS.text_secondary, marginTop: 2 },
    itemQuantity: { fontSize: 16, fontWeight: 'bold', color: COLORS.primary, marginLeft: 10 },
    footer: {
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        zIndex: 10,
    },
    actionButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingHorizontal: 20,
        paddingVertical: 10,
    },
    footerButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 8, marginHorizontal: 5 },
    reportButton: { backgroundColor: COLORS.error },
    completeButton: { backgroundColor: COLORS.primary },
    buttonText: { color: COLORS.white, fontWeight: 'bold', fontSize: 16, marginLeft: 8 },
    disabledButton: { backgroundColor: '#D1D5DB' },
    reportInput: { width: '100%', height: 100, borderColor: '#DDD', borderWidth: 1, borderRadius: 8, padding: 10, textAlignVertical: 'top', marginBottom: 20, fontSize: 16 },
     quickNavContainer: {
            flexDirection: 'row',
            justifyContent: 'space-around',
            paddingVertical: 8,
        },
        quickNavItem: {
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
        },
        quickNavText: {
            fontSize: 12,
            color: COLORS.text_secondary,
            marginTop: 2,
        },
});