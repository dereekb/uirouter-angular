import { Directive, Input, Host } from '@angular/core';
import * as i0 from "@angular/core";
import * as i1 from "./uiSrefStatus";
/**
 * A directive that adds a CSS class when its associated `uiSref` link is active.
 *
 * ### Purpose
 *
 * This directive should be paired with one (or more) [[UISref]] directives.
 * It will apply a CSS class to its element when the state the `uiSref` targets is activated.
 *
 * This can be used to create navigation UI where the active link is highlighted.
 *
 * ### Selectors
 *
 * - `[uiSrefActive]`: When this selector is used, the class is added when the target state or any
 * child of the target state is active
 * - `[uiSrefActiveEq]`: When this selector is used, the class is added when the target state is
 * exactly active (the class is not added if a child of the target state is active).
 *
 * ### Inputs
 *
 * - `uiSrefActive`/`uiSrefActiveEq`: one or more CSS classes to add to the element, when the `uiSref` is active
 *
 * #### Example:
 * The anchor tag has the `active` class added when the `foo` state is active.
 * ```html
 * <a uiSref="foo" uiSrefActive="active">Foo</a>
 * ```
 *
 * ### Matching parameters
 *
 * If the `uiSref` includes parameters, the current state must be active, *and* the parameter values must match.
 *
 * #### Example:
 * The first anchor tag has the `active` class added when the `foo.bar` state is active and the `id` parameter
 * equals 25.
 * The second anchor tag has the `active` class added when the `foo.bar` state is active and the `id` parameter
 * equals 32.
 * ```html
 * <a uiSref="foo.bar" [uiParams]="{ id: 25 }" uiSrefActive="active">Bar #25</a>
 * <a uiSref="foo.bar" [uiParams]="{ id: 32 }" uiSrefActive="active">Bar #32</a>
 * ```
 *
 * #### Example:
 * A list of anchor tags are created for a list of `bar` objects.
 * An anchor tag will have the `active` class when `foo.bar` state is active and the `id` parameter matches
 * that object's `id`.
 * ```html
 * <li *ngFor="let bar of bars">
 *   <a uiSref="foo.bar" [uiParams]="{ id: bar.id }" uiSrefActive="active">Bar #{{ bar.id }}</a>
 * </li>
 * ```
 *
 * ### Multiple uiSrefs
 *
 * A single `uiSrefActive` can be used for multiple `uiSref` links.
 * This can be used to create (for example) a drop down navigation menu, where the menui is highlighted
 * if *any* of its inner links are active.
 *
 * The `uiSrefActive` should be placed on an ancestor element of the `uiSref` list.
 * If anyof the `uiSref` links are activated, the class will be added to the ancestor element.
 *
 * #### Example:
 * This is a dropdown nagivation menu for "Admin" states.
 * When any of `admin.users`, `admin.groups`, `admin.settings` are active, the `<li>` for the dropdown
 * has the `dropdown-child-active` class applied.
 * Additionally, the active anchor tag has the `active` class applied.
 * ```html
 * <ul class="dropdown-menu">
 *   <li uiSrefActive="dropdown-child-active" class="dropdown admin">
 *     Admin
 *     <ul>
 *       <li><a uiSref="admin.users" uiSrefActive="active">Users</a></li>
 *       <li><a uiSref="admin.groups" uiSrefActive="active">Groups</a></li>
 *       <li><a uiSref="admin.settings" uiSrefActive="active">Settings</a></li>
 *     </ul>
 *   </li>
 * </ul>
 * ```
 */
export class UISrefActive {
    constructor(uiSrefStatus, rnd, host) {
        this._classes = [];
        this._classesEq = [];
        this._subscription = uiSrefStatus.uiSrefStatus.subscribe((next) => {
            this._classes.forEach((cls) => {
                if (next.active) {
                    rnd.addClass(host.nativeElement, cls);
                }
                else {
                    rnd.removeClass(host.nativeElement, cls);
                }
            });
            this._classesEq.forEach((cls) => {
                if (next.exact) {
                    rnd.addClass(host.nativeElement, cls);
                }
                else {
                    rnd.removeClass(host.nativeElement, cls);
                }
            });
        });
    }
    set active(val) {
        this._classes = val.split(/\s+/);
    }
    set activeEq(val) {
        this._classesEq = val.split(/\s+/);
    }
    ngOnDestroy() {
        this._subscription.unsubscribe();
    }
}
UISrefActive.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "14.1.0", ngImport: i0, type: UISrefActive, deps: [{ token: i1.UISrefStatus }, { token: i0.Renderer2 }, { token: i0.ElementRef, host: true }], target: i0.ɵɵFactoryTarget.Directive });
UISrefActive.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "14.1.0", type: UISrefActive, selector: "[uiSrefActive],[uiSrefActiveEq]", inputs: { active: ["uiSrefActive", "active"], activeEq: ["uiSrefActiveEq", "activeEq"] }, ngImport: i0 });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "14.1.0", ngImport: i0, type: UISrefActive, decorators: [{
            type: Directive,
            args: [{
                    selector: '[uiSrefActive],[uiSrefActiveEq]',
                }]
        }], ctorParameters: function () { return [{ type: i1.UISrefStatus }, { type: i0.Renderer2 }, { type: i0.ElementRef, decorators: [{
                    type: Host
                }] }]; }, propDecorators: { active: [{
                type: Input,
                args: ['uiSrefActive']
            }], activeEq: [{
                type: Input,
                args: ['uiSrefActiveEq']
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidWlTcmVmQWN0aXZlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2RpcmVjdGl2ZXMvdWlTcmVmQWN0aXZlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFjLElBQUksRUFBYSxNQUFNLGVBQWUsQ0FBQzs7O0FBSTlFOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQTZFRztBQUlILE1BQU0sT0FBTyxZQUFZO0lBY3ZCLFlBQVksWUFBMEIsRUFBRSxHQUFjLEVBQVUsSUFBZ0I7UUFieEUsYUFBUSxHQUFhLEVBQUUsQ0FBQztRQU14QixlQUFVLEdBQWEsRUFBRSxDQUFDO1FBUWhDLElBQUksQ0FBQyxhQUFhLEdBQUcsWUFBWSxDQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsQ0FBQyxJQUFnQixFQUFFLEVBQUU7WUFDNUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxHQUFHLEVBQUUsRUFBRTtnQkFDNUIsSUFBSSxJQUFJLENBQUMsTUFBTSxFQUFFO29CQUNmLEdBQUcsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxHQUFHLENBQUMsQ0FBQztpQkFDdkM7cUJBQU07b0JBQ0wsR0FBRyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLEdBQUcsQ0FBQyxDQUFDO2lCQUMxQztZQUNILENBQUMsQ0FBQyxDQUFDO1lBQ0gsSUFBSSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxHQUFHLEVBQUUsRUFBRTtnQkFDOUIsSUFBSSxJQUFJLENBQUMsS0FBSyxFQUFFO29CQUNkLEdBQUcsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxHQUFHLENBQUMsQ0FBQztpQkFDdkM7cUJBQU07b0JBQ0wsR0FBRyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLEdBQUcsQ0FBQyxDQUFDO2lCQUMxQztZQUNILENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDO0lBN0JELElBQ0ksTUFBTSxDQUFDLEdBQVc7UUFDcEIsSUFBSSxDQUFDLFFBQVEsR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ25DLENBQUM7SUFHRCxJQUNJLFFBQVEsQ0FBQyxHQUFXO1FBQ3RCLElBQUksQ0FBQyxVQUFVLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNyQyxDQUFDO0lBc0JELFdBQVc7UUFDVCxJQUFJLENBQUMsYUFBYSxDQUFDLFdBQVcsRUFBRSxDQUFDO0lBQ25DLENBQUM7O3lHQW5DVSxZQUFZOzZGQUFaLFlBQVk7MkZBQVosWUFBWTtrQkFIeEIsU0FBUzttQkFBQztvQkFDVCxRQUFRLEVBQUUsaUNBQWlDO2lCQUM1Qzs7MEJBZTBELElBQUk7NENBWHpELE1BQU07c0JBRFQsS0FBSzt1QkFBQyxjQUFjO2dCQU9qQixRQUFRO3NCQURYLEtBQUs7dUJBQUMsZ0JBQWdCIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgRGlyZWN0aXZlLCBJbnB1dCwgRWxlbWVudFJlZiwgSG9zdCwgUmVuZGVyZXIyIH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQgeyBVSVNyZWZTdGF0dXMsIFNyZWZTdGF0dXMgfSBmcm9tICcuL3VpU3JlZlN0YXR1cyc7XG5pbXBvcnQgeyBTdWJzY3JpcHRpb24gfSBmcm9tICdyeGpzJztcblxuLyoqXG4gKiBBIGRpcmVjdGl2ZSB0aGF0IGFkZHMgYSBDU1MgY2xhc3Mgd2hlbiBpdHMgYXNzb2NpYXRlZCBgdWlTcmVmYCBsaW5rIGlzIGFjdGl2ZS5cbiAqXG4gKiAjIyMgUHVycG9zZVxuICpcbiAqIFRoaXMgZGlyZWN0aXZlIHNob3VsZCBiZSBwYWlyZWQgd2l0aCBvbmUgKG9yIG1vcmUpIFtbVUlTcmVmXV0gZGlyZWN0aXZlcy5cbiAqIEl0IHdpbGwgYXBwbHkgYSBDU1MgY2xhc3MgdG8gaXRzIGVsZW1lbnQgd2hlbiB0aGUgc3RhdGUgdGhlIGB1aVNyZWZgIHRhcmdldHMgaXMgYWN0aXZhdGVkLlxuICpcbiAqIFRoaXMgY2FuIGJlIHVzZWQgdG8gY3JlYXRlIG5hdmlnYXRpb24gVUkgd2hlcmUgdGhlIGFjdGl2ZSBsaW5rIGlzIGhpZ2hsaWdodGVkLlxuICpcbiAqICMjIyBTZWxlY3RvcnNcbiAqXG4gKiAtIGBbdWlTcmVmQWN0aXZlXWA6IFdoZW4gdGhpcyBzZWxlY3RvciBpcyB1c2VkLCB0aGUgY2xhc3MgaXMgYWRkZWQgd2hlbiB0aGUgdGFyZ2V0IHN0YXRlIG9yIGFueVxuICogY2hpbGQgb2YgdGhlIHRhcmdldCBzdGF0ZSBpcyBhY3RpdmVcbiAqIC0gYFt1aVNyZWZBY3RpdmVFcV1gOiBXaGVuIHRoaXMgc2VsZWN0b3IgaXMgdXNlZCwgdGhlIGNsYXNzIGlzIGFkZGVkIHdoZW4gdGhlIHRhcmdldCBzdGF0ZSBpc1xuICogZXhhY3RseSBhY3RpdmUgKHRoZSBjbGFzcyBpcyBub3QgYWRkZWQgaWYgYSBjaGlsZCBvZiB0aGUgdGFyZ2V0IHN0YXRlIGlzIGFjdGl2ZSkuXG4gKlxuICogIyMjIElucHV0c1xuICpcbiAqIC0gYHVpU3JlZkFjdGl2ZWAvYHVpU3JlZkFjdGl2ZUVxYDogb25lIG9yIG1vcmUgQ1NTIGNsYXNzZXMgdG8gYWRkIHRvIHRoZSBlbGVtZW50LCB3aGVuIHRoZSBgdWlTcmVmYCBpcyBhY3RpdmVcbiAqXG4gKiAjIyMjIEV4YW1wbGU6XG4gKiBUaGUgYW5jaG9yIHRhZyBoYXMgdGhlIGBhY3RpdmVgIGNsYXNzIGFkZGVkIHdoZW4gdGhlIGBmb29gIHN0YXRlIGlzIGFjdGl2ZS5cbiAqIGBgYGh0bWxcbiAqIDxhIHVpU3JlZj1cImZvb1wiIHVpU3JlZkFjdGl2ZT1cImFjdGl2ZVwiPkZvbzwvYT5cbiAqIGBgYFxuICpcbiAqICMjIyBNYXRjaGluZyBwYXJhbWV0ZXJzXG4gKlxuICogSWYgdGhlIGB1aVNyZWZgIGluY2x1ZGVzIHBhcmFtZXRlcnMsIHRoZSBjdXJyZW50IHN0YXRlIG11c3QgYmUgYWN0aXZlLCAqYW5kKiB0aGUgcGFyYW1ldGVyIHZhbHVlcyBtdXN0IG1hdGNoLlxuICpcbiAqICMjIyMgRXhhbXBsZTpcbiAqIFRoZSBmaXJzdCBhbmNob3IgdGFnIGhhcyB0aGUgYGFjdGl2ZWAgY2xhc3MgYWRkZWQgd2hlbiB0aGUgYGZvby5iYXJgIHN0YXRlIGlzIGFjdGl2ZSBhbmQgdGhlIGBpZGAgcGFyYW1ldGVyXG4gKiBlcXVhbHMgMjUuXG4gKiBUaGUgc2Vjb25kIGFuY2hvciB0YWcgaGFzIHRoZSBgYWN0aXZlYCBjbGFzcyBhZGRlZCB3aGVuIHRoZSBgZm9vLmJhcmAgc3RhdGUgaXMgYWN0aXZlIGFuZCB0aGUgYGlkYCBwYXJhbWV0ZXJcbiAqIGVxdWFscyAzMi5cbiAqIGBgYGh0bWxcbiAqIDxhIHVpU3JlZj1cImZvby5iYXJcIiBbdWlQYXJhbXNdPVwieyBpZDogMjUgfVwiIHVpU3JlZkFjdGl2ZT1cImFjdGl2ZVwiPkJhciAjMjU8L2E+XG4gKiA8YSB1aVNyZWY9XCJmb28uYmFyXCIgW3VpUGFyYW1zXT1cInsgaWQ6IDMyIH1cIiB1aVNyZWZBY3RpdmU9XCJhY3RpdmVcIj5CYXIgIzMyPC9hPlxuICogYGBgXG4gKlxuICogIyMjIyBFeGFtcGxlOlxuICogQSBsaXN0IG9mIGFuY2hvciB0YWdzIGFyZSBjcmVhdGVkIGZvciBhIGxpc3Qgb2YgYGJhcmAgb2JqZWN0cy5cbiAqIEFuIGFuY2hvciB0YWcgd2lsbCBoYXZlIHRoZSBgYWN0aXZlYCBjbGFzcyB3aGVuIGBmb28uYmFyYCBzdGF0ZSBpcyBhY3RpdmUgYW5kIHRoZSBgaWRgIHBhcmFtZXRlciBtYXRjaGVzXG4gKiB0aGF0IG9iamVjdCdzIGBpZGAuXG4gKiBgYGBodG1sXG4gKiA8bGkgKm5nRm9yPVwibGV0IGJhciBvZiBiYXJzXCI+XG4gKiAgIDxhIHVpU3JlZj1cImZvby5iYXJcIiBbdWlQYXJhbXNdPVwieyBpZDogYmFyLmlkIH1cIiB1aVNyZWZBY3RpdmU9XCJhY3RpdmVcIj5CYXIgI3t7IGJhci5pZCB9fTwvYT5cbiAqIDwvbGk+XG4gKiBgYGBcbiAqXG4gKiAjIyMgTXVsdGlwbGUgdWlTcmVmc1xuICpcbiAqIEEgc2luZ2xlIGB1aVNyZWZBY3RpdmVgIGNhbiBiZSB1c2VkIGZvciBtdWx0aXBsZSBgdWlTcmVmYCBsaW5rcy5cbiAqIFRoaXMgY2FuIGJlIHVzZWQgdG8gY3JlYXRlIChmb3IgZXhhbXBsZSkgYSBkcm9wIGRvd24gbmF2aWdhdGlvbiBtZW51LCB3aGVyZSB0aGUgbWVudWkgaXMgaGlnaGxpZ2h0ZWRcbiAqIGlmICphbnkqIG9mIGl0cyBpbm5lciBsaW5rcyBhcmUgYWN0aXZlLlxuICpcbiAqIFRoZSBgdWlTcmVmQWN0aXZlYCBzaG91bGQgYmUgcGxhY2VkIG9uIGFuIGFuY2VzdG9yIGVsZW1lbnQgb2YgdGhlIGB1aVNyZWZgIGxpc3QuXG4gKiBJZiBhbnlvZiB0aGUgYHVpU3JlZmAgbGlua3MgYXJlIGFjdGl2YXRlZCwgdGhlIGNsYXNzIHdpbGwgYmUgYWRkZWQgdG8gdGhlIGFuY2VzdG9yIGVsZW1lbnQuXG4gKlxuICogIyMjIyBFeGFtcGxlOlxuICogVGhpcyBpcyBhIGRyb3Bkb3duIG5hZ2l2YXRpb24gbWVudSBmb3IgXCJBZG1pblwiIHN0YXRlcy5cbiAqIFdoZW4gYW55IG9mIGBhZG1pbi51c2Vyc2AsIGBhZG1pbi5ncm91cHNgLCBgYWRtaW4uc2V0dGluZ3NgIGFyZSBhY3RpdmUsIHRoZSBgPGxpPmAgZm9yIHRoZSBkcm9wZG93blxuICogaGFzIHRoZSBgZHJvcGRvd24tY2hpbGQtYWN0aXZlYCBjbGFzcyBhcHBsaWVkLlxuICogQWRkaXRpb25hbGx5LCB0aGUgYWN0aXZlIGFuY2hvciB0YWcgaGFzIHRoZSBgYWN0aXZlYCBjbGFzcyBhcHBsaWVkLlxuICogYGBgaHRtbFxuICogPHVsIGNsYXNzPVwiZHJvcGRvd24tbWVudVwiPlxuICogICA8bGkgdWlTcmVmQWN0aXZlPVwiZHJvcGRvd24tY2hpbGQtYWN0aXZlXCIgY2xhc3M9XCJkcm9wZG93biBhZG1pblwiPlxuICogICAgIEFkbWluXG4gKiAgICAgPHVsPlxuICogICAgICAgPGxpPjxhIHVpU3JlZj1cImFkbWluLnVzZXJzXCIgdWlTcmVmQWN0aXZlPVwiYWN0aXZlXCI+VXNlcnM8L2E+PC9saT5cbiAqICAgICAgIDxsaT48YSB1aVNyZWY9XCJhZG1pbi5ncm91cHNcIiB1aVNyZWZBY3RpdmU9XCJhY3RpdmVcIj5Hcm91cHM8L2E+PC9saT5cbiAqICAgICAgIDxsaT48YSB1aVNyZWY9XCJhZG1pbi5zZXR0aW5nc1wiIHVpU3JlZkFjdGl2ZT1cImFjdGl2ZVwiPlNldHRpbmdzPC9hPjwvbGk+XG4gKiAgICAgPC91bD5cbiAqICAgPC9saT5cbiAqIDwvdWw+XG4gKiBgYGBcbiAqL1xuQERpcmVjdGl2ZSh7XG4gIHNlbGVjdG9yOiAnW3VpU3JlZkFjdGl2ZV0sW3VpU3JlZkFjdGl2ZUVxXScsXG59KVxuZXhwb3J0IGNsYXNzIFVJU3JlZkFjdGl2ZSB7XG4gIHByaXZhdGUgX2NsYXNzZXM6IHN0cmluZ1tdID0gW107XG4gIEBJbnB1dCgndWlTcmVmQWN0aXZlJylcbiAgc2V0IGFjdGl2ZSh2YWw6IHN0cmluZykge1xuICAgIHRoaXMuX2NsYXNzZXMgPSB2YWwuc3BsaXQoL1xccysvKTtcbiAgfVxuXG4gIHByaXZhdGUgX2NsYXNzZXNFcTogc3RyaW5nW10gPSBbXTtcbiAgQElucHV0KCd1aVNyZWZBY3RpdmVFcScpXG4gIHNldCBhY3RpdmVFcSh2YWw6IHN0cmluZykge1xuICAgIHRoaXMuX2NsYXNzZXNFcSA9IHZhbC5zcGxpdCgvXFxzKy8pO1xuICB9XG5cbiAgcHJpdmF0ZSBfc3Vic2NyaXB0aW9uOiBTdWJzY3JpcHRpb247XG4gIGNvbnN0cnVjdG9yKHVpU3JlZlN0YXR1czogVUlTcmVmU3RhdHVzLCBybmQ6IFJlbmRlcmVyMiwgQEhvc3QoKSBob3N0OiBFbGVtZW50UmVmKSB7XG4gICAgdGhpcy5fc3Vic2NyaXB0aW9uID0gdWlTcmVmU3RhdHVzLnVpU3JlZlN0YXR1cy5zdWJzY3JpYmUoKG5leHQ6IFNyZWZTdGF0dXMpID0+IHtcbiAgICAgIHRoaXMuX2NsYXNzZXMuZm9yRWFjaCgoY2xzKSA9PiB7XG4gICAgICAgIGlmIChuZXh0LmFjdGl2ZSkge1xuICAgICAgICAgIHJuZC5hZGRDbGFzcyhob3N0Lm5hdGl2ZUVsZW1lbnQsIGNscyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcm5kLnJlbW92ZUNsYXNzKGhvc3QubmF0aXZlRWxlbWVudCwgY2xzKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICB0aGlzLl9jbGFzc2VzRXEuZm9yRWFjaCgoY2xzKSA9PiB7XG4gICAgICAgIGlmIChuZXh0LmV4YWN0KSB7XG4gICAgICAgICAgcm5kLmFkZENsYXNzKGhvc3QubmF0aXZlRWxlbWVudCwgY2xzKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBybmQucmVtb3ZlQ2xhc3MoaG9zdC5uYXRpdmVFbGVtZW50LCBjbHMpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIG5nT25EZXN0cm95KCkge1xuICAgIHRoaXMuX3N1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICB9XG59XG4iXX0=