import { extend, isNumber, isNullOrUndefined } from '@uirouter/core';
import { Directive, Inject, Input, Optional, HostListener, } from '@angular/core';
import { UIView } from './uiView';
import { ReplaySubject } from 'rxjs';
import * as i0 from "@angular/core";
import * as i1 from "@uirouter/core";
/**
 * @internal
 * # blah blah blah
 */
export class AnchorUISref {
    constructor(_el, _renderer) {
        this._el = _el;
        this._renderer = _renderer;
    }
    openInNewTab() {
        return this._el.nativeElement.target === '_blank';
    }
    update(href) {
        if (!isNullOrUndefined(href)) {
            this._renderer.setProperty(this._el.nativeElement, 'href', href);
        }
        else {
            this._renderer.removeAttribute(this._el.nativeElement, 'href');
        }
    }
}
AnchorUISref.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "14.1.0", ngImport: i0, type: AnchorUISref, deps: [{ token: i0.ElementRef }, { token: i0.Renderer2 }], target: i0.ɵɵFactoryTarget.Directive });
AnchorUISref.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "14.1.0", type: AnchorUISref, selector: "a[uiSref]", ngImport: i0 });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "14.1.0", ngImport: i0, type: AnchorUISref, decorators: [{
            type: Directive,
            args: [{ selector: 'a[uiSref]' }]
        }], ctorParameters: function () { return [{ type: i0.ElementRef }, { type: i0.Renderer2 }]; } });
/**
 * A directive when clicked, initiates a [[Transition]] to a [[TargetState]].
 *
 * ### Purpose
 *
 * This directive is applied to anchor tags (`<a>`) or any other clickable element.  It is a state reference (or sref --
 * similar to an href).  When clicked, the directive will transition to that state by calling [[StateService.go]],
 * and optionally supply state parameter values and transition options.
 *
 * When this directive is on an anchor tag, it will also add an `href` attribute to the anchor.
 *
 * ### Selector
 *
 * - `[uiSref]`: The directive is created as an attribute on an element, e.g., `<a uiSref></a>`
 *
 * ### Inputs
 *
 * - `uiSref`: the target state's name, e.g., `uiSref="foostate"`.  If a component template uses a relative `uiSref`,
 * e.g., `uiSref=".child"`, the reference is relative to that component's state.
 *
 * - `uiParams`: any target state parameter values, as an object, e.g., `[uiParams]="{ fooId: bar.fooId }"`
 *
 * - `uiOptions`: [[TransitionOptions]], e.g., `[uiOptions]="{ inherit: false }"`
 *
 * @example
 * ```html
 *
 * <!-- Targets bar state' -->
 * <a uiSref="bar">Bar</a>
 *
 * <!-- Assume this component's state is "foo".
 *      Relatively targets "foo.child" -->
 * <a uiSref=".child">Foo Child</a>
 *
 * <!-- Targets "bar" state and supplies parameter value -->
 * <a uiSref="bar" [uiParams]="{ barId: foo.barId }">Bar {{foo.barId}}</a>
 *
 * <!-- Targets "bar" state and parameter, doesn't inherit existing parameters-->
 * <a uiSref="bar" [uiParams]="{ barId: foo.barId }" [uiOptions]="{ inherit: false }">Bar {{foo.barId}}</a>
 * ```
 */
export class UISref {
    constructor(_router, _anchorUISref, parent) {
        /**
         * An observable (ReplaySubject) of the state this UISref is targeting.
         * When the UISref is clicked, it will transition to this [[TargetState]].
         */
        this.targetState$ = new ReplaySubject(1);
        /** @internal */ this._emit = false;
        this._router = _router;
        this._anchorUISref = _anchorUISref;
        this._parent = parent;
        this._statesSub = _router.globals.states$.subscribe(() => this.update());
    }
    /** @internal */
    set uiSref(val) {
        this.state = val;
        this.update();
    }
    /** @internal */
    set uiParams(val) {
        this.params = val;
        this.update();
    }
    /** @internal */
    set uiOptions(val) {
        this.options = val;
        this.update();
    }
    ngOnInit() {
        this._emit = true;
        this.update();
    }
    ngOnChanges(changes) {
        this.update();
    }
    ngOnDestroy() {
        this._emit = false;
        this._statesSub.unsubscribe();
        this.targetState$.unsubscribe();
    }
    update() {
        const $state = this._router.stateService;
        if (this._emit) {
            const newTarget = $state.target(this.state, this.params, this.getOptions());
            this.targetState$.next(newTarget);
        }
        if (this._anchorUISref) {
            if (!this.state) {
                this._anchorUISref.update(null);
            }
            else {
                const href = $state.href(this.state, this.params, this.getOptions()) || '';
                this._anchorUISref.update(href);
            }
        }
    }
    getOptions() {
        const defaultOpts = {
            relative: this._parent && this._parent.context && this._parent.context.name,
            inherit: true,
            source: 'sref',
        };
        return extend(defaultOpts, this.options || {});
    }
    /** When triggered by a (click) event, this function transitions to the UISref's target state */
    go(button, ctrlKey, metaKey) {
        if ((this._anchorUISref &&
            (this._anchorUISref.openInNewTab() || button || !isNumber(button) || ctrlKey || metaKey)) ||
            !this.state) {
            return;
        }
        this._router.stateService.go(this.state, this.params, this.getOptions());
        return false;
    }
}
UISref.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "14.1.0", ngImport: i0, type: UISref, deps: [{ token: i1.UIRouter }, { token: AnchorUISref, optional: true }, { token: UIView.PARENT_INJECT }], target: i0.ɵɵFactoryTarget.Directive });
UISref.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "14.1.0", type: UISref, selector: "[uiSref]", inputs: { state: ["uiSref", "state"], params: ["uiParams", "params"], options: ["uiOptions", "options"] }, host: { listeners: { "click": "go($event.button,$event.ctrlKey,$event.metaKey)" } }, exportAs: ["uiSref"], usesOnChanges: true, ngImport: i0 });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "14.1.0", ngImport: i0, type: UISref, decorators: [{
            type: Directive,
            args: [{
                    selector: '[uiSref]',
                    exportAs: 'uiSref',
                }]
        }], ctorParameters: function () { return [{ type: i1.UIRouter }, { type: AnchorUISref, decorators: [{
                    type: Optional
                }] }, { type: undefined, decorators: [{
                    type: Inject,
                    args: [UIView.PARENT_INJECT]
                }] }]; }, propDecorators: { state: [{
                type: Input,
                args: ['uiSref']
            }], params: [{
                type: Input,
                args: ['uiParams']
            }], options: [{
                type: Input,
                args: ['uiOptions']
            }], go: [{
                type: HostListener,
                args: ['click', ['$event.button', '$event.ctrlKey', '$event.metaKey']]
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidWlTcmVmLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2RpcmVjdGl2ZXMvdWlTcmVmLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBWSxNQUFNLEVBQW9ELFFBQVEsRUFBRSxpQkFBaUIsRUFBRSxNQUFNLGdCQUFnQixDQUFDO0FBQ2pJLE9BQU8sRUFDTCxTQUFTLEVBQ1QsTUFBTSxFQUNOLEtBQUssRUFDTCxRQUFRLEVBS1IsWUFBWSxHQUNiLE1BQU0sZUFBZSxDQUFDO0FBQ3ZCLE9BQU8sRUFBRSxNQUFNLEVBQXNCLE1BQU0sVUFBVSxDQUFDO0FBQ3RELE9BQU8sRUFBRSxhQUFhLEVBQWdCLE1BQU0sTUFBTSxDQUFDOzs7QUFFbkQ7OztHQUdHO0FBRUgsTUFBTSxPQUFPLFlBQVk7SUFDdkIsWUFBbUIsR0FBZSxFQUFTLFNBQW9CO1FBQTVDLFFBQUcsR0FBSCxHQUFHLENBQVk7UUFBUyxjQUFTLEdBQVQsU0FBUyxDQUFXO0lBQUcsQ0FBQztJQUVuRSxZQUFZO1FBQ1YsT0FBTyxJQUFJLENBQUMsR0FBRyxDQUFDLGFBQWEsQ0FBQyxNQUFNLEtBQUssUUFBUSxDQUFDO0lBQ3BELENBQUM7SUFFRCxNQUFNLENBQUMsSUFBWTtRQUNqQixJQUFJLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLEVBQUU7WUFDNUIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxhQUFhLEVBQUUsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDO1NBQ2xFO2FBQU07WUFDTCxJQUFJLENBQUMsU0FBUyxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLGFBQWEsRUFBRSxNQUFNLENBQUMsQ0FBQztTQUNoRTtJQUNILENBQUM7O3lHQWJVLFlBQVk7NkZBQVosWUFBWTsyRkFBWixZQUFZO2tCQUR4QixTQUFTO21CQUFDLEVBQUUsUUFBUSxFQUFFLFdBQVcsRUFBRTs7QUFpQnBD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bXBvcnQgeyBVSVJvdXRlciwgZXh0ZW5kLCBPYmosIFN0YXRlT3JOYW1lLCBUcmFuc2l0aW9uT3B0aW9ucywgVGFyZ2V0U3RhdGUsIGlzTnVtYmVyLCBpc051bGxPclVuZGVmaW5lZCB9IGZyb20gJ0B1aXJvdXRlci9jb3JlJztcbmltcG9ydCB7XG4gIERpcmVjdGl2ZSxcbiAgSW5qZWN0LFxuICBJbnB1dCxcbiAgT3B0aW9uYWwsXG4gIEVsZW1lbnRSZWYsXG4gIFJlbmRlcmVyMixcbiAgT25DaGFuZ2VzLFxuICBTaW1wbGVDaGFuZ2VzLFxuICBIb3N0TGlzdGVuZXIsXG59IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHsgVUlWaWV3LCBQYXJlbnRVSVZpZXdJbmplY3QgfSBmcm9tICcuL3VpVmlldyc7XG5pbXBvcnQgeyBSZXBsYXlTdWJqZWN0LCBTdWJzY3JpcHRpb24gfSBmcm9tICdyeGpzJztcblxuLyoqXG4gKiBAaW50ZXJuYWxcbiAqICMgYmxhaCBibGFoIGJsYWhcbiAqL1xuQERpcmVjdGl2ZSh7IHNlbGVjdG9yOiAnYVt1aVNyZWZdJyB9KVxuZXhwb3J0IGNsYXNzIEFuY2hvclVJU3JlZiB7XG4gIGNvbnN0cnVjdG9yKHB1YmxpYyBfZWw6IEVsZW1lbnRSZWYsIHB1YmxpYyBfcmVuZGVyZXI6IFJlbmRlcmVyMikge31cblxuICBvcGVuSW5OZXdUYWIoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2VsLm5hdGl2ZUVsZW1lbnQudGFyZ2V0ID09PSAnX2JsYW5rJztcbiAgfVxuXG4gIHVwZGF0ZShocmVmOiBzdHJpbmcpIHtcbiAgICBpZiAoIWlzTnVsbE9yVW5kZWZpbmVkKGhyZWYpKSB7XG4gICAgICB0aGlzLl9yZW5kZXJlci5zZXRQcm9wZXJ0eSh0aGlzLl9lbC5uYXRpdmVFbGVtZW50LCAnaHJlZicsIGhyZWYpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9yZW5kZXJlci5yZW1vdmVBdHRyaWJ1dGUodGhpcy5fZWwubmF0aXZlRWxlbWVudCwgJ2hyZWYnKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBBIGRpcmVjdGl2ZSB3aGVuIGNsaWNrZWQsIGluaXRpYXRlcyBhIFtbVHJhbnNpdGlvbl1dIHRvIGEgW1tUYXJnZXRTdGF0ZV1dLlxuICpcbiAqICMjIyBQdXJwb3NlXG4gKlxuICogVGhpcyBkaXJlY3RpdmUgaXMgYXBwbGllZCB0byBhbmNob3IgdGFncyAoYDxhPmApIG9yIGFueSBvdGhlciBjbGlja2FibGUgZWxlbWVudC4gIEl0IGlzIGEgc3RhdGUgcmVmZXJlbmNlIChvciBzcmVmIC0tXG4gKiBzaW1pbGFyIHRvIGFuIGhyZWYpLiAgV2hlbiBjbGlja2VkLCB0aGUgZGlyZWN0aXZlIHdpbGwgdHJhbnNpdGlvbiB0byB0aGF0IHN0YXRlIGJ5IGNhbGxpbmcgW1tTdGF0ZVNlcnZpY2UuZ29dXSxcbiAqIGFuZCBvcHRpb25hbGx5IHN1cHBseSBzdGF0ZSBwYXJhbWV0ZXIgdmFsdWVzIGFuZCB0cmFuc2l0aW9uIG9wdGlvbnMuXG4gKlxuICogV2hlbiB0aGlzIGRpcmVjdGl2ZSBpcyBvbiBhbiBhbmNob3IgdGFnLCBpdCB3aWxsIGFsc28gYWRkIGFuIGBocmVmYCBhdHRyaWJ1dGUgdG8gdGhlIGFuY2hvci5cbiAqXG4gKiAjIyMgU2VsZWN0b3JcbiAqXG4gKiAtIGBbdWlTcmVmXWA6IFRoZSBkaXJlY3RpdmUgaXMgY3JlYXRlZCBhcyBhbiBhdHRyaWJ1dGUgb24gYW4gZWxlbWVudCwgZS5nLiwgYDxhIHVpU3JlZj48L2E+YFxuICpcbiAqICMjIyBJbnB1dHNcbiAqXG4gKiAtIGB1aVNyZWZgOiB0aGUgdGFyZ2V0IHN0YXRlJ3MgbmFtZSwgZS5nLiwgYHVpU3JlZj1cImZvb3N0YXRlXCJgLiAgSWYgYSBjb21wb25lbnQgdGVtcGxhdGUgdXNlcyBhIHJlbGF0aXZlIGB1aVNyZWZgLFxuICogZS5nLiwgYHVpU3JlZj1cIi5jaGlsZFwiYCwgdGhlIHJlZmVyZW5jZSBpcyByZWxhdGl2ZSB0byB0aGF0IGNvbXBvbmVudCdzIHN0YXRlLlxuICpcbiAqIC0gYHVpUGFyYW1zYDogYW55IHRhcmdldCBzdGF0ZSBwYXJhbWV0ZXIgdmFsdWVzLCBhcyBhbiBvYmplY3QsIGUuZy4sIGBbdWlQYXJhbXNdPVwieyBmb29JZDogYmFyLmZvb0lkIH1cImBcbiAqXG4gKiAtIGB1aU9wdGlvbnNgOiBbW1RyYW5zaXRpb25PcHRpb25zXV0sIGUuZy4sIGBbdWlPcHRpb25zXT1cInsgaW5oZXJpdDogZmFsc2UgfVwiYFxuICpcbiAqIEBleGFtcGxlXG4gKiBgYGBodG1sXG4gKlxuICogPCEtLSBUYXJnZXRzIGJhciBzdGF0ZScgLS0+XG4gKiA8YSB1aVNyZWY9XCJiYXJcIj5CYXI8L2E+XG4gKlxuICogPCEtLSBBc3N1bWUgdGhpcyBjb21wb25lbnQncyBzdGF0ZSBpcyBcImZvb1wiLlxuICogICAgICBSZWxhdGl2ZWx5IHRhcmdldHMgXCJmb28uY2hpbGRcIiAtLT5cbiAqIDxhIHVpU3JlZj1cIi5jaGlsZFwiPkZvbyBDaGlsZDwvYT5cbiAqXG4gKiA8IS0tIFRhcmdldHMgXCJiYXJcIiBzdGF0ZSBhbmQgc3VwcGxpZXMgcGFyYW1ldGVyIHZhbHVlIC0tPlxuICogPGEgdWlTcmVmPVwiYmFyXCIgW3VpUGFyYW1zXT1cInsgYmFySWQ6IGZvby5iYXJJZCB9XCI+QmFyIHt7Zm9vLmJhcklkfX08L2E+XG4gKlxuICogPCEtLSBUYXJnZXRzIFwiYmFyXCIgc3RhdGUgYW5kIHBhcmFtZXRlciwgZG9lc24ndCBpbmhlcml0IGV4aXN0aW5nIHBhcmFtZXRlcnMtLT5cbiAqIDxhIHVpU3JlZj1cImJhclwiIFt1aVBhcmFtc109XCJ7IGJhcklkOiBmb28uYmFySWQgfVwiIFt1aU9wdGlvbnNdPVwieyBpbmhlcml0OiBmYWxzZSB9XCI+QmFyIHt7Zm9vLmJhcklkfX08L2E+XG4gKiBgYGBcbiAqL1xuQERpcmVjdGl2ZSh7XG4gIHNlbGVjdG9yOiAnW3VpU3JlZl0nLFxuICBleHBvcnRBczogJ3VpU3JlZicsXG59KVxuZXhwb3J0IGNsYXNzIFVJU3JlZiBpbXBsZW1lbnRzIE9uQ2hhbmdlcyB7XG4gIC8qKlxuICAgKiBgQElucHV0KCd1aVNyZWYnKWAgVGhlIG5hbWUgb2YgdGhlIHN0YXRlIHRvIGxpbmsgdG9cbiAgICpcbiAgICogYGBgaHRtbFxuICAgKiA8YSB1aVNyZWY9XCJob29tZVwiPkhvbWU8L2E+XG4gICAqIGBgYFxuICAgKi9cbiAgQElucHV0KCd1aVNyZWYnKSBzdGF0ZTogU3RhdGVPck5hbWU7XG5cbiAgLyoqXG4gICAqIGBASW5wdXQoJ3VpUGFyYW1zJylgIFRoZSBwYXJhbWV0ZXIgdmFsdWVzIHRvIHVzZSAoYXMga2V5L3ZhbHVlcylcbiAgICpcbiAgICogYGBgaHRtbFxuICAgKiA8YSB1aVNyZWY9XCJib29rXCIgW3VpUGFyYW1zXT1cInsgYm9va0lkOiBib29rLmlkIH1cIj5Cb29rIHt7IGJvb2submFtZSB9fTwvYT5cbiAgICogYGBgXG4gICAqL1xuICBASW5wdXQoJ3VpUGFyYW1zJykgcGFyYW1zOiBhbnk7XG5cbiAgLyoqXG4gICAqIGBASW5wdXQoJ3VpT3B0aW9ucycpYCBUaGUgdHJhbnNpdGlvbiBvcHRpb25zXG4gICAqXG4gICAqIGBgYGh0bWxcbiAgICogPGEgdWlTcmVmPVwiYm9va3NcIiBbdWlPcHRpb25zXT1cInsgcmVsb2FkOiB0cnVlIH1cIj5Cb29rIHt7IGJvb2submFtZSB9fTwvYT5cbiAgICogYGBgXG4gICAqL1xuICBASW5wdXQoJ3VpT3B0aW9ucycpIG9wdGlvbnM6IFRyYW5zaXRpb25PcHRpb25zO1xuXG4gIC8qKlxuICAgKiBBbiBvYnNlcnZhYmxlIChSZXBsYXlTdWJqZWN0KSBvZiB0aGUgc3RhdGUgdGhpcyBVSVNyZWYgaXMgdGFyZ2V0aW5nLlxuICAgKiBXaGVuIHRoZSBVSVNyZWYgaXMgY2xpY2tlZCwgaXQgd2lsbCB0cmFuc2l0aW9uIHRvIHRoaXMgW1tUYXJnZXRTdGF0ZV1dLlxuICAgKi9cbiAgcHVibGljIHRhcmdldFN0YXRlJCA9IG5ldyBSZXBsYXlTdWJqZWN0PFRhcmdldFN0YXRlPigxKTtcblxuICAvKiogQGludGVybmFsICovIHByaXZhdGUgX2VtaXQgPSBmYWxzZTtcbiAgLyoqIEBpbnRlcm5hbCAqLyBwcml2YXRlIF9zdGF0ZXNTdWI6IFN1YnNjcmlwdGlvbjtcbiAgLyoqIEBpbnRlcm5hbCAqLyBwcml2YXRlIF9yb3V0ZXI6IFVJUm91dGVyO1xuICAvKiogQGludGVybmFsICovIHByaXZhdGUgX2FuY2hvclVJU3JlZjogQW5jaG9yVUlTcmVmO1xuICAvKiogQGludGVybmFsICovIHByaXZhdGUgX3BhcmVudDogUGFyZW50VUlWaWV3SW5qZWN0O1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIF9yb3V0ZXI6IFVJUm91dGVyLFxuICAgIEBPcHRpb25hbCgpIF9hbmNob3JVSVNyZWY6IEFuY2hvclVJU3JlZixcbiAgICBASW5qZWN0KFVJVmlldy5QQVJFTlRfSU5KRUNUKSBwYXJlbnQ6IFBhcmVudFVJVmlld0luamVjdFxuICApIHtcbiAgICB0aGlzLl9yb3V0ZXIgPSBfcm91dGVyO1xuICAgIHRoaXMuX2FuY2hvclVJU3JlZiA9IF9hbmNob3JVSVNyZWY7XG4gICAgdGhpcy5fcGFyZW50ID0gcGFyZW50O1xuXG4gICAgdGhpcy5fc3RhdGVzU3ViID0gX3JvdXRlci5nbG9iYWxzLnN0YXRlcyQuc3Vic2NyaWJlKCgpID0+IHRoaXMudXBkYXRlKCkpO1xuICB9XG5cbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBzZXQgdWlTcmVmKHZhbDogU3RhdGVPck5hbWUpIHtcbiAgICB0aGlzLnN0YXRlID0gdmFsO1xuICAgIHRoaXMudXBkYXRlKCk7XG4gIH1cbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBzZXQgdWlQYXJhbXModmFsOiBPYmopIHtcbiAgICB0aGlzLnBhcmFtcyA9IHZhbDtcbiAgICB0aGlzLnVwZGF0ZSgpO1xuICB9XG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgc2V0IHVpT3B0aW9ucyh2YWw6IFRyYW5zaXRpb25PcHRpb25zKSB7XG4gICAgdGhpcy5vcHRpb25zID0gdmFsO1xuICAgIHRoaXMudXBkYXRlKCk7XG4gIH1cblxuICBuZ09uSW5pdCgpIHtcbiAgICB0aGlzLl9lbWl0ID0gdHJ1ZTtcbiAgICB0aGlzLnVwZGF0ZSgpO1xuICB9XG5cbiAgbmdPbkNoYW5nZXMoY2hhbmdlczogU2ltcGxlQ2hhbmdlcyk6IHZvaWQge1xuICAgIHRoaXMudXBkYXRlKCk7XG4gIH1cblxuICBuZ09uRGVzdHJveSgpIHtcbiAgICB0aGlzLl9lbWl0ID0gZmFsc2U7XG4gICAgdGhpcy5fc3RhdGVzU3ViLnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy50YXJnZXRTdGF0ZSQudW5zdWJzY3JpYmUoKTtcbiAgfVxuXG4gIHByaXZhdGUgdXBkYXRlKCkge1xuICAgIGNvbnN0ICRzdGF0ZSA9IHRoaXMuX3JvdXRlci5zdGF0ZVNlcnZpY2U7XG4gICAgaWYgKHRoaXMuX2VtaXQpIHtcbiAgICAgIGNvbnN0IG5ld1RhcmdldCA9ICRzdGF0ZS50YXJnZXQodGhpcy5zdGF0ZSwgdGhpcy5wYXJhbXMsIHRoaXMuZ2V0T3B0aW9ucygpKTtcbiAgICAgIHRoaXMudGFyZ2V0U3RhdGUkLm5leHQobmV3VGFyZ2V0KTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5fYW5jaG9yVUlTcmVmKSB7XG4gICAgICBpZiAoIXRoaXMuc3RhdGUpIHtcbiAgICAgICAgdGhpcy5fYW5jaG9yVUlTcmVmLnVwZGF0ZShudWxsKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IGhyZWYgPSAkc3RhdGUuaHJlZih0aGlzLnN0YXRlLCB0aGlzLnBhcmFtcywgdGhpcy5nZXRPcHRpb25zKCkpIHx8ICcnO1xuICAgICAgICB0aGlzLl9hbmNob3JVSVNyZWYudXBkYXRlKGhyZWYpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGdldE9wdGlvbnMoKSB7XG4gICAgY29uc3QgZGVmYXVsdE9wdHM6IFRyYW5zaXRpb25PcHRpb25zID0ge1xuICAgICAgcmVsYXRpdmU6IHRoaXMuX3BhcmVudCAmJiB0aGlzLl9wYXJlbnQuY29udGV4dCAmJiB0aGlzLl9wYXJlbnQuY29udGV4dC5uYW1lLFxuICAgICAgaW5oZXJpdDogdHJ1ZSxcbiAgICAgIHNvdXJjZTogJ3NyZWYnLFxuICAgIH07XG4gICAgcmV0dXJuIGV4dGVuZChkZWZhdWx0T3B0cywgdGhpcy5vcHRpb25zIHx8IHt9KTtcbiAgfVxuXG4gIC8qKiBXaGVuIHRyaWdnZXJlZCBieSBhIChjbGljaykgZXZlbnQsIHRoaXMgZnVuY3Rpb24gdHJhbnNpdGlvbnMgdG8gdGhlIFVJU3JlZidzIHRhcmdldCBzdGF0ZSAqL1xuICBASG9zdExpc3RlbmVyKCdjbGljaycsIFsnJGV2ZW50LmJ1dHRvbicsICckZXZlbnQuY3RybEtleScsICckZXZlbnQubWV0YUtleSddKVxuICBnbyhidXR0b246IG51bWJlciwgY3RybEtleTogYm9vbGVhbiwgbWV0YUtleTogYm9vbGVhbikge1xuICAgIGlmIChcbiAgICAgICh0aGlzLl9hbmNob3JVSVNyZWYgJiZcbiAgICAgICAgKHRoaXMuX2FuY2hvclVJU3JlZi5vcGVuSW5OZXdUYWIoKSB8fCBidXR0b24gfHwgIWlzTnVtYmVyKGJ1dHRvbikgfHwgY3RybEtleSB8fCBtZXRhS2V5KSkgfHxcbiAgICAgICF0aGlzLnN0YXRlXG4gICAgKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5fcm91dGVyLnN0YXRlU2VydmljZS5nbyh0aGlzLnN0YXRlLCB0aGlzLnBhcmFtcywgdGhpcy5nZXRPcHRpb25zKCkpO1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxufVxuIl19