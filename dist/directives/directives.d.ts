import { UISref, AnchorUISref } from './uiSref';
import { UISrefActive } from './uiSrefActive';
import { UIView } from './uiView';
import { UISrefStatus } from './uiSrefStatus';
export * from './uiView';
export * from './uiSref';
export * from './uiSrefStatus';
export * from './uiSrefActive';
/** @internal */
export declare const _UIROUTER_DIRECTIVES: (typeof UIView | typeof UISref | typeof AnchorUISref | typeof UISrefActive | typeof UISrefStatus)[];
/**
 * References to the UI-Router directive classes, for use within a @Component's `directives:` property
 * @deprecated use [[UIRouterModule]]
 * @internal
 */
export declare const UIROUTER_DIRECTIVES: (typeof UIView | typeof UISref | typeof AnchorUISref | typeof UISrefActive | typeof UISrefStatus)[];
