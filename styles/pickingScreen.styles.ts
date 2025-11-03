// d:\React-Native-\styles\pickingScreen.styles.ts

import { StyleSheet } from 'react-native';
import { COLORS } from './_colors';

export const pickingStyles = StyleSheet.create({
    itemContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 15, borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: '#EEE' },
    itemInfo: { flex: 1, marginLeft: 15 },
    itemName: { fontSize: 16, fontWeight: 'bold', color: COLORS.text_primary },
    itemVariant: { fontSize: 14, color: COLORS.text_secondary, marginTop: 2 },
    itemQuantity: { fontSize: 16, fontWeight: 'bold', color: COLORS.primary },
    footer: { flexDirection: 'row', padding: 20, borderTopWidth: 1, borderTopColor: '#EEE', backgroundColor: '#FFF' },
    footerButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 15, borderRadius: 10 },
    reportButton: { backgroundColor: COLORS.error, marginRight: 10 },
    completeButton: { backgroundColor: COLORS.primary, marginLeft: 10 },
    buttonText: { color: COLORS.white, fontWeight: 'bold', fontSize: 16, marginLeft: 8 },
    disabledButton: { backgroundColor: '#A5D6A7' },
    reportInput: { width: '100%', height: 100, borderColor: '#DDD', borderWidth: 1, borderRadius: 8, padding: 10, textAlignVertical: 'top', marginBottom: 20, fontSize: 16 },
});