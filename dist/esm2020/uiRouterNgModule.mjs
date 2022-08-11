import { UIROUTER_MODULE_TOKEN, UIROUTER_ROOT_MODULE } from './injectionTokens';
import { NgModule, ANALYZE_FOR_ENTRY_COMPONENTS, APP_INITIALIZER, } from '@angular/core';
import { CommonModule, LocationStrategy, HashLocationStrategy, PathLocationStrategy } from '@angular/common';
import { _UIROUTER_DIRECTIVES } from './directives/directives';
import { UIView } from './directives/uiView';
import { TransitionService } from '@uirouter/core';
import { _UIROUTER_INSTANCE_PROVIDERS, _UIROUTER_SERVICE_PROVIDERS } from './providers';
import * as i0 from "@angular/core";
import * as i1 from "./directives/uiSref";
import * as i2 from "./directives/uiView";
import * as i3 from "./directives/uiSrefActive";
import * as i4 from "./directives/uiSrefStatus";
// Delay angular bootstrap until first transition is successful, for SSR.
// See https://github.com/ui-router/angular/pull/127
export function onTransitionReady(transitionService, root) {
    const mod = root[0];
    if (!mod || !mod.deferInitialRender) {
        return () => Promise.resolve();
    }
    return () => new Promise((resolve) => {
        const hook = (trans) => {
            trans.promise.then(resolve, resolve);
        };
        transitionService.onStart({}, hook, { invokeLimit: 1 });
    });
}
export function makeRootProviders(module) {
    return [
        { provide: UIROUTER_ROOT_MODULE, useValue: module, multi: true },
        { provide: UIROUTER_MODULE_TOKEN, useValue: module, multi: true },
        { provide: ANALYZE_FOR_ENTRY_COMPONENTS, useValue: module.states || [], multi: true },
        {
            provide: APP_INITIALIZER,
            useFactory: onTransitionReady,
            deps: [TransitionService, UIROUTER_ROOT_MODULE],
            multi: true,
        },
    ];
}
export function makeChildProviders(module) {
    return [
        { provide: UIROUTER_MODULE_TOKEN, useValue: module, multi: true },
        { provide: ANALYZE_FOR_ENTRY_COMPONENTS, useValue: module.states || [], multi: true },
    ];
}
export function locationStrategy(useHash) {
    return { provide: LocationStrategy, useClass: useHash ? HashLocationStrategy : PathLocationStrategy };
}
/**
 * Creates UI-Router Modules
 *
 * This class has two static factory methods which create UIRouter Modules.
 * A UI-Router Module is an [Angular NgModule](https://angular.io/docs/ts/latest/guide/ngmodule.html)
 * with support for UI-Router.
 *
 * ### UIRouter Directives
 *
 * When a UI-Router Module is imported into a `NgModule`, that module's components
 * can use the UIRouter Directives such as [[UIView]], [[UISref]], [[UISrefActive]].
 *
 * ### State Definitions
 *
 * State definitions found in the `states:` property are provided to the Dependency Injector.
 * This enables UI-Router to automatically register the states with the [[StateRegistry]] at bootstrap (and during lazy load).
 *
 * ### Entry Components
 *
 * Any routed components are added as `entryComponents:` so they will get compiled.
 */
export class UIRouterModule {
    /**
     * Creates a UI-Router Module for the root (bootstrapped) application module to import
     *
     * This factory function creates an [Angular NgModule](https://angular.io/docs/ts/latest/guide/ngmodule.html)
     * with UI-Router support.
     *
     * The `forRoot` module should be added to the `imports:` of the `NgModule` being bootstrapped.
     * An application should only create and import a single `NgModule` using `forRoot()`.
     * All other modules should be created using [[UIRouterModule.forChild]].
     *
     * Unlike `forChild`, an `NgModule` returned by this factory provides the [[UIRouter]] singleton object.
     * This factory also accepts root-level router configuration.
     * These are the only differences between `forRoot` and `forChild`.
     *
     * Example:
     * ```js
     * let routerConfig = {
     *   otherwise: '/home',
     *   states: [homeState, aboutState]
     * };
     *
     * @ NgModule({
     *   imports: [
     *     BrowserModule,
     *     UIRouterModule.forRoot(routerConfig),
     *     FeatureModule1
     *   ]
     * })
     * class MyRootAppModule {}
     *
     * browserPlatformDynamic.bootstrapModule(MyRootAppModule);
     * ```
     *
     * @param config declarative UI-Router configuration
     * @returns an `NgModule` which provides the [[UIRouter]] singleton instance
     */
    static forRoot(config = {}) {
        return {
            ngModule: UIRouterModule,
            providers: [
                _UIROUTER_INSTANCE_PROVIDERS,
                _UIROUTER_SERVICE_PROVIDERS,
                locationStrategy(config.useHash),
                ...makeRootProviders(config),
            ],
        };
    }
    /**
     * Creates an `NgModule` for a UIRouter module
     *
     * This function creates an [Angular NgModule](https://angular.io/docs/ts/latest/guide/ngmodule.html)
     * with UI-Router support.
     *
     * #### Example:
     * ```js
     * var homeState = { name: 'home', url: '/home', component: Home };
     * var aboutState = { name: 'about', url: '/about', component: About };
     *
     * @ NgModule({
     *   imports: [
     *     UIRouterModule.forChild({ states: [ homeState, aboutState ] }),
     *     SharedModule,
     *   ],
     *   declarations: [ Home, About ],
     * })
     * export class AppModule {};
     * ```
     *
     * @param module UI-Router module options
     * @returns an `NgModule`
     */
    static forChild(module = {}) {
        return {
            ngModule: UIRouterModule,
            providers: makeChildProviders(module),
        };
    }
}
UIRouterModule.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "14.1.0", ngImport: i0, type: UIRouterModule, deps: [], target: i0.ɵɵFactoryTarget.NgModule });
UIRouterModule.ɵmod = i0.ɵɵngDeclareNgModule({ minVersion: "14.0.0", version: "14.1.0", ngImport: i0, type: UIRouterModule, declarations: [i1.UISref, i1.AnchorUISref, i2.UIView, i3.UISrefActive, i4.UISrefStatus], imports: [CommonModule], exports: [i1.UISref, i1.AnchorUISref, i2.UIView, i3.UISrefActive, i4.UISrefStatus] });
UIRouterModule.ɵinj = i0.ɵɵngDeclareInjector({ minVersion: "12.0.0", version: "14.1.0", ngImport: i0, type: UIRouterModule, imports: [CommonModule] });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "14.1.0", ngImport: i0, type: UIRouterModule, decorators: [{
            type: NgModule,
            args: [{
                    imports: [CommonModule],
                    declarations: [_UIROUTER_DIRECTIVES],
                    exports: [_UIROUTER_DIRECTIVES],
                    entryComponents: [UIView],
                }]
        }] });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidWlSb3V0ZXJOZ01vZHVsZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy91aVJvdXRlck5nTW9kdWxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxxQkFBcUIsRUFBRSxvQkFBb0IsRUFBRSxNQUFNLG1CQUFtQixDQUFDO0FBRWhGLE9BQU8sRUFDTCxRQUFRLEVBRVIsNEJBQTRCLEVBRzVCLGVBQWUsR0FDaEIsTUFBTSxlQUFlLENBQUM7QUFDdkIsT0FBTyxFQUFFLFlBQVksRUFBRSxnQkFBZ0IsRUFBRSxvQkFBb0IsRUFBRSxvQkFBb0IsRUFBRSxNQUFNLGlCQUFpQixDQUFDO0FBQzdHLE9BQU8sRUFBRSxvQkFBb0IsRUFBRSxNQUFNLHlCQUF5QixDQUFDO0FBQy9ELE9BQU8sRUFBRSxNQUFNLEVBQUUsTUFBTSxxQkFBcUIsQ0FBQztBQUM3QyxPQUFPLEVBQTJELGlCQUFpQixFQUFFLE1BQU0sZ0JBQWdCLENBQUM7QUFDNUcsT0FBTyxFQUFFLDRCQUE0QixFQUFFLDJCQUEyQixFQUFFLE1BQU0sYUFBYSxDQUFDOzs7Ozs7QUFFeEYseUVBQXlFO0FBQ3pFLG9EQUFvRDtBQUNwRCxNQUFNLFVBQVUsaUJBQWlCLENBQUMsaUJBQW9DLEVBQUUsSUFBa0I7SUFDeEYsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3BCLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsa0JBQWtCLEVBQUU7UUFDbkMsT0FBTyxHQUFHLEVBQUUsQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7S0FDaEM7SUFFRCxPQUFPLEdBQUcsRUFBRSxDQUNWLElBQUksT0FBTyxDQUFDLENBQUMsT0FBTyxFQUFFLEVBQUU7UUFDdEIsTUFBTSxJQUFJLEdBQUcsQ0FBQyxLQUFLLEVBQUUsRUFBRTtZQUNyQixLQUFLLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDdkMsQ0FBQyxDQUFDO1FBQ0YsaUJBQWlCLENBQUMsT0FBTyxDQUFDLEVBQUUsRUFBRSxJQUFJLEVBQUUsRUFBRSxXQUFXLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUMxRCxDQUFDLENBQUMsQ0FBQztBQUNQLENBQUM7QUFFRCxNQUFNLFVBQVUsaUJBQWlCLENBQUMsTUFBa0I7SUFDbEQsT0FBTztRQUNMLEVBQUUsT0FBTyxFQUFFLG9CQUFvQixFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRTtRQUNoRSxFQUFFLE9BQU8sRUFBRSxxQkFBcUIsRUFBRSxRQUFRLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUU7UUFDakUsRUFBRSxPQUFPLEVBQUUsNEJBQTRCLEVBQUUsUUFBUSxFQUFFLE1BQU0sQ0FBQyxNQUFNLElBQUksRUFBRSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUU7UUFDckY7WUFDRSxPQUFPLEVBQUUsZUFBZTtZQUN4QixVQUFVLEVBQUUsaUJBQWlCO1lBQzdCLElBQUksRUFBRSxDQUFDLGlCQUFpQixFQUFFLG9CQUFvQixDQUFDO1lBQy9DLEtBQUssRUFBRSxJQUFJO1NBQ1o7S0FDRixDQUFDO0FBQ0osQ0FBQztBQUVELE1BQU0sVUFBVSxrQkFBa0IsQ0FBQyxNQUFvQjtJQUNyRCxPQUFPO1FBQ0wsRUFBRSxPQUFPLEVBQUUscUJBQXFCLEVBQUUsUUFBUSxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFO1FBQ2pFLEVBQUUsT0FBTyxFQUFFLDRCQUE0QixFQUFFLFFBQVEsRUFBRSxNQUFNLENBQUMsTUFBTSxJQUFJLEVBQUUsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFO0tBQ3RGLENBQUM7QUFDSixDQUFDO0FBRUQsTUFBTSxVQUFVLGdCQUFnQixDQUFDLE9BQU87SUFDdEMsT0FBTyxFQUFFLE9BQU8sRUFBRSxnQkFBZ0IsRUFBRSxRQUFRLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztBQUN4RyxDQUFDO0FBRUQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBb0JHO0FBT0gsTUFBTSxPQUFPLGNBQWM7SUFDekI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O09BbUNHO0lBQ0gsTUFBTSxDQUFDLE9BQU8sQ0FBQyxTQUFxQixFQUFFO1FBQ3BDLE9BQU87WUFDTCxRQUFRLEVBQUUsY0FBYztZQUN4QixTQUFTLEVBQUU7Z0JBQ1QsNEJBQTRCO2dCQUM1QiwyQkFBMkI7Z0JBQzNCLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUM7Z0JBQ2hDLEdBQUcsaUJBQWlCLENBQUMsTUFBTSxDQUFDO2FBQzdCO1NBQ0YsQ0FBQztJQUNKLENBQUM7SUFFRDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7T0F1Qkc7SUFDSCxNQUFNLENBQUMsUUFBUSxDQUFDLFNBQXVCLEVBQUU7UUFDdkMsT0FBTztZQUNMLFFBQVEsRUFBRSxjQUFjO1lBQ3hCLFNBQVMsRUFBRSxrQkFBa0IsQ0FBQyxNQUFNLENBQUM7U0FDdEMsQ0FBQztJQUNKLENBQUM7OzJHQTlFVSxjQUFjOzRHQUFkLGNBQWMscUdBTGYsWUFBWTs0R0FLWCxjQUFjLFlBTGYsWUFBWTsyRkFLWCxjQUFjO2tCQU4xQixRQUFRO21CQUFDO29CQUNSLE9BQU8sRUFBRSxDQUFDLFlBQVksQ0FBQztvQkFDdkIsWUFBWSxFQUFFLENBQUMsb0JBQW9CLENBQUM7b0JBQ3BDLE9BQU8sRUFBRSxDQUFDLG9CQUFvQixDQUFDO29CQUMvQixlQUFlLEVBQUUsQ0FBQyxNQUFNLENBQUM7aUJBQzFCIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgVUlST1VURVJfTU9EVUxFX1RPS0VOLCBVSVJPVVRFUl9ST09UX01PRFVMRSB9IGZyb20gJy4vaW5qZWN0aW9uVG9rZW5zJztcbmltcG9ydCB7IE5nMlN0YXRlRGVjbGFyYXRpb24gfSBmcm9tICcuL2ludGVyZmFjZSc7XG5pbXBvcnQge1xuICBOZ01vZHVsZSxcbiAgTW9kdWxlV2l0aFByb3ZpZGVycyxcbiAgQU5BTFlaRV9GT1JfRU5UUllfQ09NUE9ORU5UUyxcbiAgUHJvdmlkZXIsXG4gIEluamVjdG9yLFxuICBBUFBfSU5JVElBTElaRVIsXG59IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHsgQ29tbW9uTW9kdWxlLCBMb2NhdGlvblN0cmF0ZWd5LCBIYXNoTG9jYXRpb25TdHJhdGVneSwgUGF0aExvY2F0aW9uU3RyYXRlZ3kgfSBmcm9tICdAYW5ndWxhci9jb21tb24nO1xuaW1wb3J0IHsgX1VJUk9VVEVSX0RJUkVDVElWRVMgfSBmcm9tICcuL2RpcmVjdGl2ZXMvZGlyZWN0aXZlcyc7XG5pbXBvcnQgeyBVSVZpZXcgfSBmcm9tICcuL2RpcmVjdGl2ZXMvdWlWaWV3JztcbmltcG9ydCB7IFVybFJ1bGVIYW5kbGVyRm4sIFRhcmdldFN0YXRlLCBUYXJnZXRTdGF0ZURlZiwgVUlSb3V0ZXIsIFRyYW5zaXRpb25TZXJ2aWNlIH0gZnJvbSAnQHVpcm91dGVyL2NvcmUnO1xuaW1wb3J0IHsgX1VJUk9VVEVSX0lOU1RBTkNFX1BST1ZJREVSUywgX1VJUk9VVEVSX1NFUlZJQ0VfUFJPVklERVJTIH0gZnJvbSAnLi9wcm92aWRlcnMnO1xuXG4vLyBEZWxheSBhbmd1bGFyIGJvb3RzdHJhcCB1bnRpbCBmaXJzdCB0cmFuc2l0aW9uIGlzIHN1Y2Nlc3NmdWwsIGZvciBTU1IuXG4vLyBTZWUgaHR0cHM6Ly9naXRodWIuY29tL3VpLXJvdXRlci9hbmd1bGFyL3B1bGwvMTI3XG5leHBvcnQgZnVuY3Rpb24gb25UcmFuc2l0aW9uUmVhZHkodHJhbnNpdGlvblNlcnZpY2U6IFRyYW5zaXRpb25TZXJ2aWNlLCByb290OiBSb290TW9kdWxlW10pIHtcbiAgY29uc3QgbW9kID0gcm9vdFswXTtcbiAgaWYgKCFtb2QgfHwgIW1vZC5kZWZlckluaXRpYWxSZW5kZXIpIHtcbiAgICByZXR1cm4gKCkgPT4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gIH1cblxuICByZXR1cm4gKCkgPT5cbiAgICBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgY29uc3QgaG9vayA9ICh0cmFucykgPT4ge1xuICAgICAgICB0cmFucy5wcm9taXNlLnRoZW4ocmVzb2x2ZSwgcmVzb2x2ZSk7XG4gICAgICB9O1xuICAgICAgdHJhbnNpdGlvblNlcnZpY2Uub25TdGFydCh7fSwgaG9vaywgeyBpbnZva2VMaW1pdDogMSB9KTtcbiAgICB9KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG1ha2VSb290UHJvdmlkZXJzKG1vZHVsZTogUm9vdE1vZHVsZSk6IFByb3ZpZGVyW10ge1xuICByZXR1cm4gW1xuICAgIHsgcHJvdmlkZTogVUlST1VURVJfUk9PVF9NT0RVTEUsIHVzZVZhbHVlOiBtb2R1bGUsIG11bHRpOiB0cnVlIH0sXG4gICAgeyBwcm92aWRlOiBVSVJPVVRFUl9NT0RVTEVfVE9LRU4sIHVzZVZhbHVlOiBtb2R1bGUsIG11bHRpOiB0cnVlIH0sXG4gICAgeyBwcm92aWRlOiBBTkFMWVpFX0ZPUl9FTlRSWV9DT01QT05FTlRTLCB1c2VWYWx1ZTogbW9kdWxlLnN0YXRlcyB8fCBbXSwgbXVsdGk6IHRydWUgfSxcbiAgICB7XG4gICAgICBwcm92aWRlOiBBUFBfSU5JVElBTElaRVIsXG4gICAgICB1c2VGYWN0b3J5OiBvblRyYW5zaXRpb25SZWFkeSxcbiAgICAgIGRlcHM6IFtUcmFuc2l0aW9uU2VydmljZSwgVUlST1VURVJfUk9PVF9NT0RVTEVdLFxuICAgICAgbXVsdGk6IHRydWUsXG4gICAgfSxcbiAgXTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG1ha2VDaGlsZFByb3ZpZGVycyhtb2R1bGU6IFN0YXRlc01vZHVsZSk6IFByb3ZpZGVyW10ge1xuICByZXR1cm4gW1xuICAgIHsgcHJvdmlkZTogVUlST1VURVJfTU9EVUxFX1RPS0VOLCB1c2VWYWx1ZTogbW9kdWxlLCBtdWx0aTogdHJ1ZSB9LFxuICAgIHsgcHJvdmlkZTogQU5BTFlaRV9GT1JfRU5UUllfQ09NUE9ORU5UUywgdXNlVmFsdWU6IG1vZHVsZS5zdGF0ZXMgfHwgW10sIG11bHRpOiB0cnVlIH0sXG4gIF07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBsb2NhdGlvblN0cmF0ZWd5KHVzZUhhc2gpIHtcbiAgcmV0dXJuIHsgcHJvdmlkZTogTG9jYXRpb25TdHJhdGVneSwgdXNlQ2xhc3M6IHVzZUhhc2ggPyBIYXNoTG9jYXRpb25TdHJhdGVneSA6IFBhdGhMb2NhdGlvblN0cmF0ZWd5IH07XG59XG5cbi8qKlxuICogQ3JlYXRlcyBVSS1Sb3V0ZXIgTW9kdWxlc1xuICpcbiAqIFRoaXMgY2xhc3MgaGFzIHR3byBzdGF0aWMgZmFjdG9yeSBtZXRob2RzIHdoaWNoIGNyZWF0ZSBVSVJvdXRlciBNb2R1bGVzLlxuICogQSBVSS1Sb3V0ZXIgTW9kdWxlIGlzIGFuIFtBbmd1bGFyIE5nTW9kdWxlXShodHRwczovL2FuZ3VsYXIuaW8vZG9jcy90cy9sYXRlc3QvZ3VpZGUvbmdtb2R1bGUuaHRtbClcbiAqIHdpdGggc3VwcG9ydCBmb3IgVUktUm91dGVyLlxuICpcbiAqICMjIyBVSVJvdXRlciBEaXJlY3RpdmVzXG4gKlxuICogV2hlbiBhIFVJLVJvdXRlciBNb2R1bGUgaXMgaW1wb3J0ZWQgaW50byBhIGBOZ01vZHVsZWAsIHRoYXQgbW9kdWxlJ3MgY29tcG9uZW50c1xuICogY2FuIHVzZSB0aGUgVUlSb3V0ZXIgRGlyZWN0aXZlcyBzdWNoIGFzIFtbVUlWaWV3XV0sIFtbVUlTcmVmXV0sIFtbVUlTcmVmQWN0aXZlXV0uXG4gKlxuICogIyMjIFN0YXRlIERlZmluaXRpb25zXG4gKlxuICogU3RhdGUgZGVmaW5pdGlvbnMgZm91bmQgaW4gdGhlIGBzdGF0ZXM6YCBwcm9wZXJ0eSBhcmUgcHJvdmlkZWQgdG8gdGhlIERlcGVuZGVuY3kgSW5qZWN0b3IuXG4gKiBUaGlzIGVuYWJsZXMgVUktUm91dGVyIHRvIGF1dG9tYXRpY2FsbHkgcmVnaXN0ZXIgdGhlIHN0YXRlcyB3aXRoIHRoZSBbW1N0YXRlUmVnaXN0cnldXSBhdCBib290c3RyYXAgKGFuZCBkdXJpbmcgbGF6eSBsb2FkKS5cbiAqXG4gKiAjIyMgRW50cnkgQ29tcG9uZW50c1xuICpcbiAqIEFueSByb3V0ZWQgY29tcG9uZW50cyBhcmUgYWRkZWQgYXMgYGVudHJ5Q29tcG9uZW50czpgIHNvIHRoZXkgd2lsbCBnZXQgY29tcGlsZWQuXG4gKi9cbkBOZ01vZHVsZSh7XG4gIGltcG9ydHM6IFtDb21tb25Nb2R1bGVdLFxuICBkZWNsYXJhdGlvbnM6IFtfVUlST1VURVJfRElSRUNUSVZFU10sXG4gIGV4cG9ydHM6IFtfVUlST1VURVJfRElSRUNUSVZFU10sXG4gIGVudHJ5Q29tcG9uZW50czogW1VJVmlld10sXG59KVxuZXhwb3J0IGNsYXNzIFVJUm91dGVyTW9kdWxlIHtcbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBVSS1Sb3V0ZXIgTW9kdWxlIGZvciB0aGUgcm9vdCAoYm9vdHN0cmFwcGVkKSBhcHBsaWNhdGlvbiBtb2R1bGUgdG8gaW1wb3J0XG4gICAqXG4gICAqIFRoaXMgZmFjdG9yeSBmdW5jdGlvbiBjcmVhdGVzIGFuIFtBbmd1bGFyIE5nTW9kdWxlXShodHRwczovL2FuZ3VsYXIuaW8vZG9jcy90cy9sYXRlc3QvZ3VpZGUvbmdtb2R1bGUuaHRtbClcbiAgICogd2l0aCBVSS1Sb3V0ZXIgc3VwcG9ydC5cbiAgICpcbiAgICogVGhlIGBmb3JSb290YCBtb2R1bGUgc2hvdWxkIGJlIGFkZGVkIHRvIHRoZSBgaW1wb3J0czpgIG9mIHRoZSBgTmdNb2R1bGVgIGJlaW5nIGJvb3RzdHJhcHBlZC5cbiAgICogQW4gYXBwbGljYXRpb24gc2hvdWxkIG9ubHkgY3JlYXRlIGFuZCBpbXBvcnQgYSBzaW5nbGUgYE5nTW9kdWxlYCB1c2luZyBgZm9yUm9vdCgpYC5cbiAgICogQWxsIG90aGVyIG1vZHVsZXMgc2hvdWxkIGJlIGNyZWF0ZWQgdXNpbmcgW1tVSVJvdXRlck1vZHVsZS5mb3JDaGlsZF1dLlxuICAgKlxuICAgKiBVbmxpa2UgYGZvckNoaWxkYCwgYW4gYE5nTW9kdWxlYCByZXR1cm5lZCBieSB0aGlzIGZhY3RvcnkgcHJvdmlkZXMgdGhlIFtbVUlSb3V0ZXJdXSBzaW5nbGV0b24gb2JqZWN0LlxuICAgKiBUaGlzIGZhY3RvcnkgYWxzbyBhY2NlcHRzIHJvb3QtbGV2ZWwgcm91dGVyIGNvbmZpZ3VyYXRpb24uXG4gICAqIFRoZXNlIGFyZSB0aGUgb25seSBkaWZmZXJlbmNlcyBiZXR3ZWVuIGBmb3JSb290YCBhbmQgYGZvckNoaWxkYC5cbiAgICpcbiAgICogRXhhbXBsZTpcbiAgICogYGBganNcbiAgICogbGV0IHJvdXRlckNvbmZpZyA9IHtcbiAgICogICBvdGhlcndpc2U6ICcvaG9tZScsXG4gICAqICAgc3RhdGVzOiBbaG9tZVN0YXRlLCBhYm91dFN0YXRlXVxuICAgKiB9O1xuICAgKlxuICAgKiBAIE5nTW9kdWxlKHtcbiAgICogICBpbXBvcnRzOiBbXG4gICAqICAgICBCcm93c2VyTW9kdWxlLFxuICAgKiAgICAgVUlSb3V0ZXJNb2R1bGUuZm9yUm9vdChyb3V0ZXJDb25maWcpLFxuICAgKiAgICAgRmVhdHVyZU1vZHVsZTFcbiAgICogICBdXG4gICAqIH0pXG4gICAqIGNsYXNzIE15Um9vdEFwcE1vZHVsZSB7fVxuICAgKlxuICAgKiBicm93c2VyUGxhdGZvcm1EeW5hbWljLmJvb3RzdHJhcE1vZHVsZShNeVJvb3RBcHBNb2R1bGUpO1xuICAgKiBgYGBcbiAgICpcbiAgICogQHBhcmFtIGNvbmZpZyBkZWNsYXJhdGl2ZSBVSS1Sb3V0ZXIgY29uZmlndXJhdGlvblxuICAgKiBAcmV0dXJucyBhbiBgTmdNb2R1bGVgIHdoaWNoIHByb3ZpZGVzIHRoZSBbW1VJUm91dGVyXV0gc2luZ2xldG9uIGluc3RhbmNlXG4gICAqL1xuICBzdGF0aWMgZm9yUm9vdChjb25maWc6IFJvb3RNb2R1bGUgPSB7fSk6IE1vZHVsZVdpdGhQcm92aWRlcnM8VUlSb3V0ZXJNb2R1bGU+IHtcbiAgICByZXR1cm4ge1xuICAgICAgbmdNb2R1bGU6IFVJUm91dGVyTW9kdWxlLFxuICAgICAgcHJvdmlkZXJzOiBbXG4gICAgICAgIF9VSVJPVVRFUl9JTlNUQU5DRV9QUk9WSURFUlMsXG4gICAgICAgIF9VSVJPVVRFUl9TRVJWSUNFX1BST1ZJREVSUyxcbiAgICAgICAgbG9jYXRpb25TdHJhdGVneShjb25maWcudXNlSGFzaCksXG4gICAgICAgIC4uLm1ha2VSb290UHJvdmlkZXJzKGNvbmZpZyksXG4gICAgICBdLFxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhbiBgTmdNb2R1bGVgIGZvciBhIFVJUm91dGVyIG1vZHVsZVxuICAgKlxuICAgKiBUaGlzIGZ1bmN0aW9uIGNyZWF0ZXMgYW4gW0FuZ3VsYXIgTmdNb2R1bGVdKGh0dHBzOi8vYW5ndWxhci5pby9kb2NzL3RzL2xhdGVzdC9ndWlkZS9uZ21vZHVsZS5odG1sKVxuICAgKiB3aXRoIFVJLVJvdXRlciBzdXBwb3J0LlxuICAgKlxuICAgKiAjIyMjIEV4YW1wbGU6XG4gICAqIGBgYGpzXG4gICAqIHZhciBob21lU3RhdGUgPSB7IG5hbWU6ICdob21lJywgdXJsOiAnL2hvbWUnLCBjb21wb25lbnQ6IEhvbWUgfTtcbiAgICogdmFyIGFib3V0U3RhdGUgPSB7IG5hbWU6ICdhYm91dCcsIHVybDogJy9hYm91dCcsIGNvbXBvbmVudDogQWJvdXQgfTtcbiAgICpcbiAgICogQCBOZ01vZHVsZSh7XG4gICAqICAgaW1wb3J0czogW1xuICAgKiAgICAgVUlSb3V0ZXJNb2R1bGUuZm9yQ2hpbGQoeyBzdGF0ZXM6IFsgaG9tZVN0YXRlLCBhYm91dFN0YXRlIF0gfSksXG4gICAqICAgICBTaGFyZWRNb2R1bGUsXG4gICAqICAgXSxcbiAgICogICBkZWNsYXJhdGlvbnM6IFsgSG9tZSwgQWJvdXQgXSxcbiAgICogfSlcbiAgICogZXhwb3J0IGNsYXNzIEFwcE1vZHVsZSB7fTtcbiAgICogYGBgXG4gICAqXG4gICAqIEBwYXJhbSBtb2R1bGUgVUktUm91dGVyIG1vZHVsZSBvcHRpb25zXG4gICAqIEByZXR1cm5zIGFuIGBOZ01vZHVsZWBcbiAgICovXG4gIHN0YXRpYyBmb3JDaGlsZChtb2R1bGU6IFN0YXRlc01vZHVsZSA9IHt9KTogTW9kdWxlV2l0aFByb3ZpZGVyczxVSVJvdXRlck1vZHVsZT4ge1xuICAgIHJldHVybiB7XG4gICAgICBuZ01vZHVsZTogVUlSb3V0ZXJNb2R1bGUsXG4gICAgICBwcm92aWRlcnM6IG1ha2VDaGlsZFByb3ZpZGVycyhtb2R1bGUpLFxuICAgIH07XG4gIH1cbn1cblxuLyoqXG4gKiBVSS1Sb3V0ZXIgZGVjbGFyYXRpdmUgY29uZmlndXJhdGlvbiB3aGljaCBjYW4gYmUgcHJvdmlkZWQgdG8gW1tVSVJvdXRlck1vZHVsZS5mb3JSb290XV1cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBSb290TW9kdWxlIGV4dGVuZHMgU3RhdGVzTW9kdWxlIHtcbiAgLyoqXG4gICAqIENob29zZXMgYSBgTG9jYXRpb25TdHJhdGVneWAuXG4gICAqXG4gICAqIFRoZSBsb2NhdGlvbiBzdHJhdGVneSBlbmFibGVzIGVpdGhlciBIVE1MNSBQdXNoIFN0YXRlXG4gICAqIChSZXF1aXJlcyBzZXJ2ZXItc2lkZSBzdXBwb3J0KSBvciBcIkhhc2hCYW5nXCIgVVJMcy5cbiAgICpcbiAgICogV2hlbiBgZmFsc2VgLCB1c2VzIFtgUGF0aExvY2F0aW9uU3RyYXRlZ3lgXShodHRwczovL2FuZ3VsYXIuaW8vZG9jcy90cy9sYXRlc3QvYXBpL2NvbW1vbi9pbmRleC9QYXRoTG9jYXRpb25TdHJhdGVneS1jbGFzcy5odG1sKVxuICAgKiBXaGVuIGB0cnVlYCwgdXNlcyBbYEhhc2hMb2NhdGlvblN0cmF0ZWd5YF0oaHR0cHM6Ly9hbmd1bGFyLmlvL2RvY3MvdHMvbGF0ZXN0L2FwaS9jb21tb24vaW5kZXgvSGFzaExvY2F0aW9uU3RyYXRlZ3ktY2xhc3MuaHRtbClcbiAgICpcbiAgICogRGVmYXVsdHMgdG8gYGZhbHNlYFxuICAgKi9cbiAgdXNlSGFzaD86IGJvb2xlYW47XG5cbiAgLyoqXG4gICAqIENvbmZpZ3VyZXMgdGhlIGBvdGhlcndpc2VgIHJ1bGUsIHdoaWNoIGNob29zZXMgdGhlIHN0YXRlIG9yIFVSTCB0byBhY3RpdmF0ZSB3aGVuIG5vIG90aGVyIHJvdXRlcyBtYXRjaGVkLlxuICAgKlxuICAgKiBTZWU6IFtbVXJsUnVsZXNBcGkub3RoZXJ3aXNlXV0uXG4gICAqL1xuICBvdGhlcndpc2U/OiBzdHJpbmcgfCBVcmxSdWxlSGFuZGxlckZuIHwgVGFyZ2V0U3RhdGUgfCBUYXJnZXRTdGF0ZURlZjtcblxuICAvKipcbiAgICogQ29uZmlndXJlcyB0aGUgYGluaXRpYWxgIHJ1bGUsIHdoaWNoIGNob29zZXMgdGhlIHN0YXRlIG9yIFVSTCB0byBhY3RpdmF0ZSB3aGVuIHRoZVxuICAgKiBhcHBsaWNhdGlvbiBpbml0aWFsbHkgc3RhcnRzLCBhbmQgbm8gb3RoZXIgcm91dGVzIG1hdGNoZWQuXG4gICAqXG4gICAqIFNlZTogW1tVcmxSdWxlc0FwaS5pbml0aWFsXV0uXG4gICAqL1xuICBpbml0aWFsPzogc3RyaW5nIHwgVXJsUnVsZUhhbmRsZXJGbiB8IFRhcmdldFN0YXRlIHwgVGFyZ2V0U3RhdGVEZWY7XG5cbiAgLyoqXG4gICAqIFNldHMgW1tVcmxSb3V0ZXJQcm92aWRlci5kZWZlckludGVyY2VwdF1dXG4gICAqL1xuICBkZWZlckludGVyY2VwdD86IGJvb2xlYW47XG5cbiAgLyoqXG4gICAqIFRlbGxzIEFuZ3VsYXIgdG8gZGVmZXIgdGhlIGZpcnN0IHJlbmRlciB1bnRpbCBhZnRlciB0aGUgaW5pdGlhbCB0cmFuc2l0aW9uIGlzIGNvbXBsZXRlLlxuICAgKlxuICAgKiBXaGVuIGB0cnVlYCwgYWRkcyBhbiBhc3luYyBgQVBQX0lOSVRJQUxJWkVSYCB3aGljaCBpcyByZXNvbHZlZCBhZnRlciBhbnkgYG9uU3VjY2Vzc2Agb3IgYG9uRXJyb3JgLlxuICAgKiBUaGUgaW5pdGlhbGl6ZXIgc3RvcHMgYW5ndWxhciBmcm9tIHJlbmRlcmluZyB0aGUgcm9vdCBjb21wb25lbnQgdW50aWwgYWZ0ZXIgdGhlIGZpcnN0IHRyYW5zaXRpb24gY29tcGxldGVzLlxuICAgKiBUaGlzIG1heSBwcmV2ZW50IGluaXRpYWwgcGFnZSBmbGlja2VyIHdoaWxlIHRoZSBzdGF0ZSBpcyBiZWluZyBsb2FkZWQuXG4gICAqXG4gICAqIERlZmF1bHRzIHRvIGBmYWxzZWBcbiAgICovXG4gIGRlZmVySW5pdGlhbFJlbmRlcj86IGJvb2xlYW47XG59XG5cbi8qKlxuICogVUktUm91dGVyIE1vZHVsZSBkZWNsYXJhdGl2ZSBjb25maWd1cmF0aW9uIHdoaWNoIGNhbiBiZSBwYXNzZWQgdG8gW1tVSVJvdXRlck1vZHVsZS5mb3JDaGlsZF1dXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgU3RhdGVzTW9kdWxlIHtcbiAgLyoqXG4gICAqIFRoZSBtb2R1bGUncyBVSS1Sb3V0ZXIgc3RhdGVzXG4gICAqXG4gICAqIFRoaXMgbGlzdCBvZiBbW05nMlN0YXRlRGVjbGFyYXRpb25dXSBvYmplY3RzIHdpbGwgYmUgcmVnaXN0ZXJlZCB3aXRoIHRoZSBbW1N0YXRlUmVnaXN0cnldXS5cbiAgICogQWxzbywgdGhlIGNvbXBvbmVudHMgdGhhdCB0aGUgc3RhdGVzIHJvdXRlIHRvIHdpbGwgYmUgYWRkZWQgdG8gYGVudHJ5Q29tcG9uZW50c2Agc28gdGhleSB3aWxsIGJlIGNvbXBpbGVkLlxuICAgKi9cbiAgc3RhdGVzPzogTmcyU3RhdGVEZWNsYXJhdGlvbltdO1xuXG4gIC8qKlxuICAgKiBBIFVJLVJvdXRlciBNb2R1bGUncyBpbXBlcmF0aXZlIGNvbmZpZ3VyYXRpb25cbiAgICpcbiAgICogSWYgYSBVSS1Sb3V0ZXIgTW9kdWxlIG5lZWRzIHRvIHBlcmZvcm0gc29tZSBjb25maWd1cmF0aW9uIChzdWNoIGFzIHJlZ2lzdGVyaW5nXG4gICAqIHBhcmFtZXRlciB0eXBlcyBvciBUcmFuc2l0aW9uIEhvb2tzKSBhIGBjb25maWdGbmAgc2hvdWxkIGJlIHN1cHBsaWVkLlxuICAgKiBUaGUgZnVuY3Rpb24gd2lsbCBiZSBwYXNzZWQgdGhlIGBVSVJvdXRlcmAgaW5zdGFuY2UsIHRoZSBtb2R1bGUncyBgSW5qZWN0b3JgLFxuICAgKiBhbmQgdGhlIG1vZHVsZSBvYmplY3QuXG4gICAqXG4gICAqICMjIyMgRXhhbXBsZTpcbiAgICogYGBganNcbiAgICogaW1wb3J0IHsgSW5qZWN0b3IgfSBmcm9tIFwiQGFuZ3VsYXIvY29yZVwiO1xuICAgKiBpbXBvcnQgeyBVSVJvdXRlciB9IGZyb20gXCJAdWlyb3V0ZXIvYW5ndWxhclwiO1xuICAgKiBpbXBvcnQgeyByZXF1aXJlQXV0aEhvb2sgfSBmcm9tIFwiLi9yZXF1aXJlQXV0aEhvb2tcIjtcbiAgICogaW1wb3J0IHsgTXlTZXJ2aWNlIH0gZnJvbSBcIi4vbXlTZXJ2aWNlXCI7XG4gICAqXG4gICAqIGV4cG9ydCBmdW5jdGlvbiBjb25maWd1cmVNeU1vZHVsZSh1aVJvdXRlcjogVUlSb3V0ZXIsIGluamVjdG9yOiBJbmplY3RvciwgbW9kdWxlOiBTdGF0ZXNNb2R1bGUpIHtcbiAgICogICAvLyBHZXQgVUlSb3V0ZXIgc2VydmljZXMgb2ZmIHRoZSBVSVJvdXRlciBvYmplY3RcbiAgICogICBsZXQgdXJsQ29uZmlnID0gdWlSb3V0ZXIudXJsU2VydmljZS5jb25maWc7XG4gICAqICAgbGV0IHRyYW5zaXRpb25TZXJ2aWNlID0gdWlSb3V0ZXIudHJhbnNpdGlvblNlcnZpY2U7XG4gICAqICAgdWlSb3V0ZXIudHJhY2UuZW5hYmxlKFwiVFJBTlNJVElPTlwiKTtcbiAgICpcbiAgICogICB0cmFuc2l0aW9uU2VydmljZS5vbkJlZm9yZSh7IHRvOiAoc3RhdGUpID0+IHN0YXRlLnJlcXVpcmVzQXV0aCB9LCByZXF1aXJlQXV0aEhvb2spO1xuICAgKlxuICAgKiAgIC8vIENyZWF0ZSBhIHNsdWcgdHlwZSBiYXNlZCBvbiB0aGUgc3RyaW5nIHR5cGVcbiAgICogICBsZXQgYnVpbHRJblN0cmluZ1R5cGUgPSB1cmxDb25maWcudHlwZSgnc3RyaW5nJyk7XG4gICAqICAgbGV0IHNsdWdUeXBlID0gT2JqZWN0LmFzc2lnbih7fSwgYnVpbHRJblN0cmluZ1R5cGUsIHsgZW5jb2RlOiAoc3RyKSA9PiBzdHIsIGRlY29kZTogKHN0cikgPT4gc3RyIH0pO1xuICAgKiAgIHVybENvbmZpZy50eXBlKCdzbHVnJywgc2x1Z1R5cGUpO1xuICAgKlxuICAgKiAgIC8vIEluamVjdCBhcmJpdHJhcnkgc2VydmljZXMgZnJvbSBESSB1c2luZyB0aGUgSW5qZWN0b3IgYXJndW1lbnRcbiAgICogICBsZXQgbXlTZXJ2aWNlOiBNeVNlcnZpY2UgPSBpbmplY3Rvci5nZXQoTXlTZXJ2aWNlKVxuICAgKiAgIG15U2VydmljZS51c2VGYXN0TW9kZSgpO1xuICAgKiB9XG4gICAqIGBgYFxuICAgKlxuICAgKiBgYGBqc1xuICAgKiBATmdNb2R1bGUoe1xuICAgKiAgIGltcG9ydHM6IFtcbiAgICogICAgIFVJUm91dGVyTW9kdWxlLmZvckNoaWxkKHsgc3RhdGVzOiBTVEFURVMsIGNvbmZpZzogY29uZmlndXJlTXlNb2R1bGUgfSk7XG4gICAqICAgXVxuICAgKiB9KVxuICAgKiBjbGFzcyBNeU1vZHVsZSB7fVxuICAgKiBgYGBcbiAgICovXG4gIGNvbmZpZz86ICh1aVJvdXRlckluc3RhbmNlOiBVSVJvdXRlciwgaW5qZWN0b3I6IEluamVjdG9yLCBtb2R1bGU6IFN0YXRlc01vZHVsZSkgPT4gYW55O1xufVxuIl19