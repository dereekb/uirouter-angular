import { Component, ComponentFactoryResolver, Inject, Input, ReflectiveInjector, ViewChild, ViewContainerRef, } from '@angular/core';
import { filter, inArray, isFunction, NATIVE_INJECTOR_TOKEN, parse, ResolveContext, trace, unnestR, } from '@uirouter/core';
import { Ng2ViewConfig } from '../statebuilders/views';
import { MergeInjector } from '../mergeInjector';
import * as i0 from "@angular/core";
import * as i1 from "@uirouter/core";
import * as i2 from "@angular/common";
/** @hidden */
let id = 0;
/**
 * Given a component class, gets the inputs of styles:
 *
 * - @Input('foo') _foo
 * - `inputs: ['foo']`
 *
 * @internal
 */
const ng2ComponentInputs = (factory) => {
    return factory.inputs.map((input) => ({ prop: input.propName, token: input.templateName }));
};
/**
 * A UI-Router viewport directive, which is filled in by a view (component) on a state.
 *
 * ### Selector
 *
 * A `ui-view` directive can be created as an element: `<ui-view></ui-view>` or as an attribute: `<div ui-view></div>`.
 *
 * ### Purpose
 *
 * This directive is used in a Component template (or as the root component) to create a viewport.  The viewport
 * is filled in by a view (as defined by a [[Ng2ViewDeclaration]] inside a [[Ng2StateDeclaration]]) when the view's
 * state has been activated.
 *
 * #### Example:
 * ```js
 * // This app has two states, 'foo' and 'bar'
 * stateRegistry.register({ name: 'foo', url: '/foo', component: FooComponent });
 * stateRegistry.register({ name: 'bar', url: '/bar', component: BarComponent });
 * ```
 * ```html
 * <!-- This ui-view will be filled in by the foo state's component or
 *      the bar state's component when the foo or bar state is activated -->
 * <ui-view></ui-view>
 * ```
 *
 * ### Named ui-views
 *
 * A `ui-view` may optionally be given a name via the attribute value: `<div ui-view='header'></div>`.  *Note:
 * an unnamed `ui-view` is internally named `$default`*.   When a `ui-view` has a name, it will be filled in
 * by a matching named view.
 *
 * #### Example:
 * ```js
 * stateRegistry.register({
 *   name: 'foo',
 *   url: '/foo',
 *   views: { header: HeaderComponent, $default: FooComponent });
 * ```
 * ```html
 * <!-- When 'foo' state is active, filled by HeaderComponent -->
 * <div ui-view="header"></div>
 *
 * <!-- When 'foo' state is active, filled by FooComponent -->
 * <ui-view></ui-view>
 * ```
 */
export class UIView {
    constructor(router, parent, viewContainerRef) {
        this.router = router;
        this.viewContainerRef = viewContainerRef;
        /** Data about the this UIView */
        this._uiViewData = {};
        this._parent = parent;
    }
    set _name(val) {
        this.name = val;
    }
    /**
     * @returns the UI-Router `state` that is filling this uiView, or `undefined`.
     */
    get state() {
        return parse('_uiViewData.config.viewDecl.$context.self')(this);
    }
    ngOnInit() {
        const router = this.router;
        const parentFqn = this._parent.fqn;
        const name = this.name || '$default';
        this._uiViewData = {
            $type: 'ng2',
            id: id++,
            name: name,
            fqn: parentFqn ? parentFqn + '.' + name : name,
            creationContext: this._parent.context,
            configUpdated: this._viewConfigUpdated.bind(this),
            config: undefined,
        };
        this._deregisterUiCanExitHook = router.transitionService.onBefore({}, (trans) => {
            return this._invokeUiCanExitHook(trans);
        });
        this._deregisterUiOnParamsChangedHook = router.transitionService.onSuccess({}, (trans) => this._invokeUiOnParamsChangedHook(trans));
        this._deregisterUIView = router.viewService.registerUIView(this._uiViewData);
    }
    /**
     * For each transition, checks the component loaded in the ui-view for:
     *
     * - has a uiCanExit() component hook
     * - is being exited
     *
     * If both are true, adds the uiCanExit component function as a hook to that singular Transition.
     */
    _invokeUiCanExitHook(trans) {
        const instance = this._componentRef && this._componentRef.instance;
        const uiCanExitFn = instance && instance.uiCanExit;
        if (isFunction(uiCanExitFn)) {
            const state = this.state;
            if (trans.exiting().indexOf(state) !== -1) {
                trans.onStart({}, function () {
                    return uiCanExitFn.call(instance, trans);
                });
            }
        }
    }
    /**
     * For each transition, checks if any param values changed and notify component
     */
    _invokeUiOnParamsChangedHook($transition$) {
        const instance = this._componentRef && this._componentRef.instance;
        const uiOnParamsChanged = instance && instance.uiOnParamsChanged;
        if (isFunction(uiOnParamsChanged)) {
            const viewState = this.state;
            const resolveContext = new ResolveContext(this._uiViewData.config.path);
            const viewCreationTrans = resolveContext.getResolvable('$transition$').data;
            // Exit early if the $transition$ is the same as the view was created within.
            // Exit early if the $transition$ will exit the state the view is for.
            if ($transition$ === viewCreationTrans || $transition$.exiting().indexOf(viewState) !== -1)
                return;
            const toParams = $transition$.params('to');
            const fromParams = $transition$.params('from');
            const getNodeSchema = (node) => node.paramSchema;
            const toSchema = $transition$.treeChanges('to').map(getNodeSchema).reduce(unnestR, []);
            const fromSchema = $transition$.treeChanges('from').map(getNodeSchema).reduce(unnestR, []);
            // Find the to params that have different values than the from params
            const changedToParams = toSchema.filter((param) => {
                const idx = fromSchema.indexOf(param);
                return idx === -1 || !fromSchema[idx].type.equals(toParams[param.id], fromParams[param.id]);
            });
            // Only trigger callback if a to param has changed or is new
            if (changedToParams.length) {
                const changedKeys = changedToParams.map((x) => x.id);
                // Filter the params to only changed/new to params.  `$transition$.params()` may be used to get all params.
                const newValues = filter(toParams, (val, key) => changedKeys.indexOf(key) !== -1);
                instance.uiOnParamsChanged(newValues, $transition$);
            }
        }
    }
    _disposeLast() {
        if (this._componentRef)
            this._componentRef.destroy();
        this._componentRef = null;
    }
    ngOnDestroy() {
        if (this._deregisterUIView)
            this._deregisterUIView();
        if (this._deregisterUiCanExitHook)
            this._deregisterUiCanExitHook();
        if (this._deregisterUiOnParamsChangedHook)
            this._deregisterUiOnParamsChangedHook();
        this._deregisterUIView = this._deregisterUiCanExitHook = this._deregisterUiOnParamsChangedHook = null;
        this._disposeLast();
    }
    /**
     * The view service is informing us of an updated ViewConfig
     * (usually because a transition activated some state and its views)
     */
    _viewConfigUpdated(config) {
        // The config may be undefined if there is nothing currently targeting this UIView.
        // Dispose the current component, if there is one
        if (!config)
            return this._disposeLast();
        // Only care about Ng2 configs
        if (!(config instanceof Ng2ViewConfig))
            return;
        // The "new" viewconfig is already applied, so exit early
        if (this._uiViewData.config === config)
            return;
        // This is a new ViewConfig.  Dispose the previous component
        this._disposeLast();
        trace.traceUIViewConfigUpdated(this._uiViewData, config && config.viewDecl.$context);
        this._applyUpdatedConfig(config);
        // Initiate change detection for the newly created component
        this._componentRef.changeDetectorRef.markForCheck();
    }
    _applyUpdatedConfig(config) {
        this._uiViewData.config = config;
        // Create the Injector for the routed component
        const context = new ResolveContext(config.path);
        const componentInjector = this._getComponentInjector(context);
        // Get the component class from the view declaration. TODO: allow promises?
        const componentClass = config.viewDecl.component;
        // Create the component
        const compFactoryResolver = componentInjector.get(ComponentFactoryResolver);
        const compFactory = compFactoryResolver.resolveComponentFactory(componentClass);
        this._componentRef = this._componentTarget.createComponent(compFactory, undefined, componentInjector);
        // Wire resolves to @Input()s
        this._applyInputBindings(compFactory, this._componentRef.instance, context, componentClass);
    }
    /**
     * Creates a new Injector for a routed component.
     *
     * Adds resolve values to the Injector
     * Adds providers from the NgModule for the state
     * Adds providers from the parent Component in the component tree
     * Adds a PARENT_INJECT view context object
     *
     * @returns an Injector
     */
    _getComponentInjector(context) {
        // Map resolves to "useValue: providers"
        const resolvables = context
            .getTokens()
            .map((token) => context.getResolvable(token))
            .filter((r) => r.resolved);
        const newProviders = resolvables.map((r) => ({ provide: r.token, useValue: context.injector().get(r.token) }));
        const parentInject = { context: this._uiViewData.config.viewDecl.$context, fqn: this._uiViewData.fqn };
        newProviders.push({ provide: UIView.PARENT_INJECT, useValue: parentInject });
        const parentComponentInjector = this.viewContainerRef.injector;
        const moduleInjector = context.getResolvable(NATIVE_INJECTOR_TOKEN).data;
        const mergedParentInjector = new MergeInjector(moduleInjector, parentComponentInjector);
        return ReflectiveInjector.resolveAndCreate(newProviders, mergedParentInjector);
    }
    /**
     * Supplies component inputs with resolve data
     *
     * Finds component inputs which match resolves (by name) and sets the input value
     * to the resolve data.
     */
    _applyInputBindings(factory, component, context, componentClass) {
        const bindings = this._uiViewData.config.viewDecl['bindings'] || {};
        const explicitBoundProps = Object.keys(bindings);
        // Returns the actual component property for a renamed an input renamed using `@Input('foo') _foo`.
        // return the `_foo` property
        const renamedInputProp = (prop) => {
            const input = factory.inputs.find((i) => i.templateName === prop);
            return (input && input.propName) || prop;
        };
        // Supply resolve data to component as specified in the state's `bindings: {}`
        const explicitInputTuples = explicitBoundProps.reduce((acc, key) => acc.concat([{ prop: renamedInputProp(key), token: bindings[key] }]), []);
        // Supply resolve data to matching @Input('prop') or inputs: ['prop']
        const implicitInputTuples = ng2ComponentInputs(factory).filter((tuple) => !inArray(explicitBoundProps, tuple.prop));
        const addResolvable = (tuple) => ({
            prop: tuple.prop,
            resolvable: context.getResolvable(tuple.token),
        });
        const injector = context.injector();
        explicitInputTuples
            .concat(implicitInputTuples)
            .map(addResolvable)
            .filter((tuple) => tuple.resolvable && tuple.resolvable.resolved)
            .forEach((tuple) => {
            component[tuple.prop] = injector.get(tuple.resolvable.token);
        });
    }
}
UIView.PARENT_INJECT = 'UIView.PARENT_INJECT';
UIView.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "14.1.0", ngImport: i0, type: UIView, deps: [{ token: i1.UIRouter }, { token: UIView.PARENT_INJECT }, { token: i0.ViewContainerRef }], target: i0.ɵɵFactoryTarget.Component });
UIView.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "14.1.0", type: UIView, selector: "ui-view, [ui-view]", inputs: { name: "name", _name: ["ui-view", "_name"] }, viewQueries: [{ propertyName: "_componentTarget", first: true, predicate: ["componentTarget"], descendants: true, read: ViewContainerRef, static: true }], exportAs: ["uiView"], ngImport: i0, template: `
    <ng-template #componentTarget></ng-template>
    <ng-content *ngIf="!_componentRef"></ng-content>
  `, isInline: true, dependencies: [{ kind: "directive", type: i2.NgIf, selector: "[ngIf]", inputs: ["ngIf", "ngIfThen", "ngIfElse"] }] });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "14.1.0", ngImport: i0, type: UIView, decorators: [{
            type: Component,
            args: [{
                    selector: 'ui-view, [ui-view]',
                    exportAs: 'uiView',
                    template: `
    <ng-template #componentTarget></ng-template>
    <ng-content *ngIf="!_componentRef"></ng-content>
  `,
                }]
        }], ctorParameters: function () { return [{ type: i1.UIRouter }, { type: undefined, decorators: [{
                    type: Inject,
                    args: [UIView.PARENT_INJECT]
                }] }, { type: i0.ViewContainerRef }]; }, propDecorators: { _componentTarget: [{
                type: ViewChild,
                args: ['componentTarget', { read: ViewContainerRef, static: true }]
            }], name: [{
                type: Input,
                args: ['name']
            }], _name: [{
                type: Input,
                args: ['ui-view']
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidWlWaWV3LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2RpcmVjdGl2ZXMvdWlWaWV3LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFDTCxTQUFTLEVBRVQsd0JBQXdCLEVBRXhCLE1BQU0sRUFFTixLQUFLLEVBR0wsa0JBQWtCLEVBQ2xCLFNBQVMsRUFDVCxnQkFBZ0IsR0FDakIsTUFBTSxlQUFlLENBQUM7QUFFdkIsT0FBTyxFQUVMLE1BQU0sRUFDTixPQUFPLEVBQ1AsVUFBVSxFQUNWLHFCQUFxQixFQUVyQixLQUFLLEVBRUwsY0FBYyxFQUVkLEtBQUssRUFJTCxPQUFPLEdBR1IsTUFBTSxnQkFBZ0IsQ0FBQztBQUN4QixPQUFPLEVBQUUsYUFBYSxFQUFFLE1BQU0sd0JBQXdCLENBQUM7QUFDdkQsT0FBTyxFQUFFLGFBQWEsRUFBRSxNQUFNLGtCQUFrQixDQUFDOzs7O0FBRWpELGNBQWM7QUFDZCxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUM7QUFjWDs7Ozs7OztHQU9HO0FBQ0gsTUFBTSxrQkFBa0IsR0FBRyxDQUFDLE9BQThCLEVBQWtCLEVBQUU7SUFDNUUsT0FBTyxPQUFPLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FBQyxFQUFFLElBQUksRUFBRSxLQUFLLENBQUMsUUFBUSxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUMsWUFBWSxFQUFFLENBQUMsQ0FBQyxDQUFDO0FBQzlGLENBQUMsQ0FBQztBQUVGOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0E2Q0c7QUFTSCxNQUFNLE9BQU8sTUFBTTtJQXdCakIsWUFDUyxNQUFnQixFQUNPLE1BQU0sRUFDN0IsZ0JBQWtDO1FBRmxDLFdBQU0sR0FBTixNQUFNLENBQVU7UUFFaEIscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFrQjtRQVAzQyxpQ0FBaUM7UUFDekIsZ0JBQVcs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QyxhQUFhOzJFQXRCOUIsZ0JBQWdCO3NCQURmLFNBQVM7dUJBQUMsaUJBQWlCLEVBQUUsRUFBRSxJQUFJLEVBQUUsZ0JBQWdCLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRTtnQkFFdkQsSUFBSTtzQkFBbEIsS0FBSzt1QkFBQyxNQUFNO2dCQUdULEtBQUs7c0JBRFIsS0FBSzt1QkFBQyxTQUFTIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcbiAgQ29tcG9uZW50LFxuICBDb21wb25lbnRGYWN0b3J5LFxuICBDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIsXG4gIENvbXBvbmVudFJlZixcbiAgSW5qZWN0LFxuICBJbmplY3RvcixcbiAgSW5wdXQsXG4gIE9uRGVzdHJveSxcbiAgT25Jbml0LFxuICBSZWZsZWN0aXZlSW5qZWN0b3IsXG4gIFZpZXdDaGlsZCxcbiAgVmlld0NvbnRhaW5lclJlZixcbn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5cbmltcG9ydCB7XG4gIEFjdGl2ZVVJVmlldyxcbiAgZmlsdGVyLFxuICBpbkFycmF5LFxuICBpc0Z1bmN0aW9uLFxuICBOQVRJVkVfSU5KRUNUT1JfVE9LRU4sXG4gIFBhcmFtLFxuICBwYXJzZSxcbiAgUGF0aE5vZGUsXG4gIFJlc29sdmVDb250ZXh0LFxuICBTdGF0ZURlY2xhcmF0aW9uLFxuICB0cmFjZSxcbiAgVHJhbnNpdGlvbixcbiAgVHJhbnNpdGlvbkhvb2tGbixcbiAgVUlSb3V0ZXIsXG4gIHVubmVzdFIsXG4gIFZpZXdDb25maWcsXG4gIFZpZXdDb250ZXh0LFxufSBmcm9tICdAdWlyb3V0ZXIvY29yZSc7XG5pbXBvcnQgeyBOZzJWaWV3Q29uZmlnIH0gZnJvbSAnLi4vc3RhdGVidWlsZGVycy92aWV3cyc7XG5pbXBvcnQgeyBNZXJnZUluamVjdG9yIH0gZnJvbSAnLi4vbWVyZ2VJbmplY3Rvcic7XG5cbi8qKiBAaGlkZGVuICovXG5sZXQgaWQgPSAwO1xuXG4vKiogQGludGVybmFsIFRoZXNlIGFyZSBwcm92aWRlKClkIGFzIHRoZSBzdHJpbmcgVUlWaWV3LlBBUkVOVF9JTkpFQ1QgKi9cbmV4cG9ydCBpbnRlcmZhY2UgUGFyZW50VUlWaWV3SW5qZWN0IHtcbiAgY29udGV4dDogVmlld0NvbnRleHQ7XG4gIGZxbjogc3RyaW5nO1xufVxuXG4vKiogQGludGVybmFsICovXG5pbnRlcmZhY2UgSW5wdXRNYXBwaW5nIHtcbiAgdG9rZW46IHN0cmluZztcbiAgcHJvcDogc3RyaW5nO1xufVxuXG4vKipcbiAqIEdpdmVuIGEgY29tcG9uZW50IGNsYXNzLCBnZXRzIHRoZSBpbnB1dHMgb2Ygc3R5bGVzOlxuICpcbiAqIC0gQElucHV0KCdmb28nKSBfZm9vXG4gKiAtIGBpbnB1dHM6IFsnZm9vJ11gXG4gKlxuICogQGludGVybmFsXG4gKi9cbmNvbnN0IG5nMkNvbXBvbmVudElucHV0cyA9IChmYWN0b3J5OiBDb21wb25lbnRGYWN0b3J5PGFueT4pOiBJbnB1dE1hcHBpbmdbXSA9PiB7XG4gIHJldHVybiBmYWN0b3J5LmlucHV0cy5tYXAoKGlucHV0KSA9PiAoeyBwcm9wOiBpbnB1dC5wcm9wTmFtZSwgdG9rZW46IGlucHV0LnRlbXBsYXRlTmFtZSB9KSk7XG59O1xuXG4vKipcbiAqIEEgVUktUm91dGVyIHZpZXdwb3J0IGRpcmVjdGl2ZSwgd2hpY2ggaXMgZmlsbGVkIGluIGJ5IGEgdmlldyAoY29tcG9uZW50KSBvbiBhIHN0YXRlLlxuICpcbiAqICMjIyBTZWxlY3RvclxuICpcbiAqIEEgYHVpLXZpZXdgIGRpcmVjdGl2ZSBjYW4gYmUgY3JlYXRlZCBhcyBhbiBlbGVtZW50OiBgPHVpLXZpZXc+PC91aS12aWV3PmAgb3IgYXMgYW4gYXR0cmlidXRlOiBgPGRpdiB1aS12aWV3PjwvZGl2PmAuXG4gKlxuICogIyMjIFB1cnBvc2VcbiAqXG4gKiBUaGlzIGRpcmVjdGl2ZSBpcyB1c2VkIGluIGEgQ29tcG9uZW50IHRlbXBsYXRlIChvciBhcyB0aGUgcm9vdCBjb21wb25lbnQpIHRvIGNyZWF0ZSBhIHZpZXdwb3J0LiAgVGhlIHZpZXdwb3J0XG4gKiBpcyBmaWxsZWQgaW4gYnkgYSB2aWV3IChhcyBkZWZpbmVkIGJ5IGEgW1tOZzJWaWV3RGVjbGFyYXRpb25dXSBpbnNpZGUgYSBbW05nMlN0YXRlRGVjbGFyYXRpb25dXSkgd2hlbiB0aGUgdmlldydzXG4gKiBzdGF0ZSBoYXMgYmVlbiBhY3RpdmF0ZWQuXG4gKlxuICogIyMjIyBFeGFtcGxlOlxuICogYGBganNcbiAqIC8vIFRoaXMgYXBwIGhhcyB0d28gc3RhdGVzLCAnZm9vJyBhbmQgJ2JhcidcbiAqIHN0YXRlUmVnaXN0cnkucmVnaXN0ZXIoeyBuYW1lOiAnZm9vJywgdXJsOiAnL2ZvbycsIGNvbXBvbmVudDogRm9vQ29tcG9uZW50IH0pO1xuICogc3RhdGVSZWdpc3RyeS5yZWdpc3Rlcih7IG5hbWU6ICdiYXInLCB1cmw6ICcvYmFyJywgY29tcG9uZW50OiBCYXJDb21wb25lbnQgfSk7XG4gKiBgYGBcbiAqIGBgYGh0bWxcbiAqIDwhLS0gVGhpcyB1aS12aWV3IHdpbGwgYmUgZmlsbGVkIGluIGJ5IHRoZSBmb28gc3RhdGUncyBjb21wb25lbnQgb3JcbiAqICAgICAgdGhlIGJhciBzdGF0ZSdzIGNvbXBvbmVudCB3aGVuIHRoZSBmb28gb3IgYmFyIHN0YXRlIGlzIGFjdGl2YXRlZCAtLT5cbiAqIDx1aS12aWV3PjwvdWktdmlldz5cbiAqIGBgYFxuICpcbiAqICMjIyBOYW1lZCB1aS12aWV3c1xuICpcbiAqIEEgYHVpLXZpZXdgIG1heSBvcHRpb25hbGx5IGJlIGdpdmVuIGEgbmFtZSB2aWEgdGhlIGF0dHJpYnV0ZSB2YWx1ZTogYDxkaXYgdWktdmlldz0naGVhZGVyJz48L2Rpdj5gLiAgKk5vdGU6XG4gKiBhbiB1bm5hbWVkIGB1aS12aWV3YCBpcyBpbnRlcm5hbGx5IG5hbWVkIGAkZGVmYXVsdGAqLiAgIFdoZW4gYSBgdWktdmlld2AgaGFzIGEgbmFtZSwgaXQgd2lsbCBiZSBmaWxsZWQgaW5cbiAqIGJ5IGEgbWF0Y2hpbmcgbmFtZWQgdmlldy5cbiAqXG4gKiAjIyMjIEV4YW1wbGU6XG4gKiBgYGBqc1xuICogc3RhdGVSZWdpc3RyeS5yZWdpc3Rlcih7XG4gKiAgIG5hbWU6ICdmb28nLFxuICogICB1cmw6ICcvZm9vJyxcbiAqICAgdmlld3M6IHsgaGVhZGVyOiBIZWFkZXJDb21wb25lbnQsICRkZWZhdWx0OiBGb29Db21wb25lbnQgfSk7XG4gKiBgYGBcbiAqIGBgYGh0bWxcbiAqIDwhLS0gV2hlbiAnZm9vJyBzdGF0ZSBpcyBhY3RpdmUsIGZpbGxlZCBieSBIZWFkZXJDb21wb25lbnQgLS0+XG4gKiA8ZGl2IHVpLXZpZXc9XCJoZWFkZXJcIj48L2Rpdj5cbiAqXG4gKiA8IS0tIFdoZW4gJ2Zvbycgc3RhdGUgaXMgYWN0aXZlLCBmaWxsZWQgYnkgRm9vQ29tcG9uZW50IC0tPlxuICogPHVpLXZpZXc+PC91aS12aWV3PlxuICogYGBgXG4gKi9cbkBDb21wb25lbnQoe1xuICBzZWxlY3RvcjogJ3VpLXZpZXcsIFt1aS12aWV3XScsXG4gIGV4cG9ydEFzOiAndWlWaWV3JyxcbiAgdGVtcGxhdGU6IGBcbiAgICA8bmctdGVtcGxhdGUgI2NvbXBvbmVudFRhcmdldD48L25nLXRlbXBsYXRlPlxuICAgIDxuZy1jb250ZW50ICpuZ0lmPVwiIV9jb21wb25lbnRSZWZcIj48L25nLWNvbnRlbnQ+XG4gIGAsXG59KVxuZXhwb3J0IGNsYXNzIFVJVmlldyBpbXBsZW1lbnRzIE9uSW5pdCwgT25EZXN0cm95IHtcbiAgc3RhdGljIFBBUkVOVF9JTkpFQ1QgPSAnVUlWaWV3LlBBUkVOVF9JTkpFQ1QnO1xuXG4gIEBWaWV3Q2hpbGQoJ2NvbXBvbmVudFRhcmdldCcsIHsgcmVhZDogVmlld0NvbnRhaW5lclJlZiwgc3RhdGljOiB0cnVlIH0pXG4gIF9jb21wb25lbnRUYXJnZXQ6IFZpZXdDb250YWluZXJSZWY7XG4gIEBJbnB1dCgnbmFtZScpIG5hbWU6IHN0cmluZztcblxuICBASW5wdXQoJ3VpLXZpZXcnKVxuICBzZXQgX25hbWUodmFsOiBzdHJpbmcpIHtcbiAgICB0aGlzLm5hbWUgPSB2YWw7XG4gIH1cblxuICAvKiogVGhlIHJlZmVyZW5jZSB0byB0aGUgY29tcG9uZW50IGN1cnJlbnRseSBpbnNpZGUgdGhlIHZpZXdwb3J0ICovXG4gIF9jb21wb25lbnRSZWY6IENvbXBvbmVudFJlZjxhbnk+O1xuICAvKiogRGVyZWdpc3RlcnMgdGhlIHVpLXZpZXcgZnJvbSB0aGUgdmlldyBzZXJ2aWNlICovXG4gIHByaXZhdGUgX2RlcmVnaXN0ZXJVSVZpZXc6IEZ1bmN0aW9uO1xuICAvKiogRGVyZWdpc3RlcnMgdGhlIG1hc3RlciB1aUNhbkV4aXQgdHJhbnNpdGlvbiBob29rICovXG4gIHByaXZhdGUgX2RlcmVnaXN0ZXJVaUNhbkV4aXRIb29rOiBGdW5jdGlvbjtcbiAgLyoqIERlcmVnaXN0ZXJzIHRoZSBtYXN0ZXIgdWlPblBhcmFtc0NoYW5nZWQgdHJhbnNpdGlvbiBob29rICovXG4gIHByaXZhdGUgX2RlcmVnaXN0ZXJVaU9uUGFyYW1zQ2hhbmdlZEhvb2s6IEZ1bmN0aW9uO1xuICAvKiogRGF0YSBhYm91dCB0aGUgdGhpcyBVSVZpZXcgKi9cbiAgcHJpdmF0ZSBfdWlWaWV3RGF0YTogQWN0aXZlVUlWaWV3ID0gPGFueT57fTtcbiAgcHJpdmF0ZSBfcGFyZW50OiBQYXJlbnRVSVZpZXdJbmplY3Q7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgcHVibGljIHJvdXRlcjogVUlSb3V0ZXIsXG4gICAgQEluamVjdChVSVZpZXcuUEFSRU5UX0lOSkVDVCkgcGFyZW50LFxuICAgIHB1YmxpYyB2aWV3Q29udGFpbmVyUmVmOiBWaWV3Q29udGFpbmVyUmVmXG4gICkge1xuICAgIHRoaXMuX3BhcmVudCA9IHBhcmVudDtcbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJucyB0aGUgVUktUm91dGVyIGBzdGF0ZWAgdGhhdCBpcyBmaWxsaW5nIHRoaXMgdWlWaWV3LCBvciBgdW5kZWZpbmVkYC5cbiAgICovXG4gIHB1YmxpYyBnZXQgc3RhdGUoKTogU3RhdGVEZWNsYXJhdGlvbiB7XG4gICAgcmV0dXJuIHBhcnNlKCdfdWlWaWV3RGF0YS5jb25maWcudmlld0RlY2wuJGNvbnRleHQuc2VsZicpKHRoaXMpO1xuICB9XG5cbiAgbmdPbkluaXQoKSB7XG4gICAgY29uc3Qgcm91dGVyID0gdGhpcy5yb3V0ZXI7XG4gICAgY29uc3QgcGFyZW50RnFuID0gdGhpcy5fcGFyZW50LmZxbjtcbiAgICBjb25zdCBuYW1lID0gdGhpcy5uYW1lIHx8ICckZGVmYXVsdCc7XG5cbiAgICB0aGlzLl91aVZpZXdEYXRhID0ge1xuICAgICAgJHR5cGU6ICduZzInLFxuICAgICAgaWQ6IGlkKyssXG4gICAgICBuYW1lOiBuYW1lLFxuICAgICAgZnFuOiBwYXJlbnRGcW4gPyBwYXJlbnRGcW4gKyAnLicgKyBuYW1lIDogbmFtZSxcbiAgICAgIGNyZWF0aW9uQ29udGV4dDogdGhpcy5fcGFyZW50LmNvbnRleHQsXG4gICAgICBjb25maWdVcGRhdGVkOiB0aGlzLl92aWV3Q29uZmlnVXBkYXRlZC5iaW5kKHRoaXMpLFxuICAgICAgY29uZmlnOiB1bmRlZmluZWQsXG4gICAgfTtcblxuICAgIHRoaXMuX2RlcmVnaXN0ZXJVaUNhbkV4aXRIb29rID0gcm91dGVyLnRyYW5zaXRpb25TZXJ2aWNlLm9uQmVmb3JlKHt9LCAodHJhbnMpID0+IHtcbiAgICAgIHJldHVybiB0aGlzLl9pbnZva2VVaUNhbkV4aXRIb29rKHRyYW5zKTtcbiAgICB9KTtcblxuICAgIHRoaXMuX2RlcmVnaXN0ZXJVaU9uUGFyYW1zQ2hhbmdlZEhvb2sgPSByb3V0ZXIudHJhbnNpdGlvblNlcnZpY2Uub25TdWNjZXNzKHt9LCAodHJhbnMpID0+XG4gICAgICB0aGlzLl9pbnZva2VVaU9uUGFyYW1zQ2hhbmdlZEhvb2sodHJhbnMpXG4gICAgKTtcblxuICAgIHRoaXMuX2RlcmVnaXN0ZXJVSVZpZXcgPSByb3V0ZXIudmlld1NlcnZpY2UucmVnaXN0ZXJVSVZpZXcodGhpcy5fdWlWaWV3RGF0YSk7XG4gIH1cblxuICAvKipcbiAgICogRm9yIGVhY2ggdHJhbnNpdGlvbiwgY2hlY2tzIHRoZSBjb21wb25lbnQgbG9hZGVkIGluIHRoZSB1aS12aWV3IGZvcjpcbiAgICpcbiAgICogLSBoYXMgYSB1aUNhbkV4aXQoKSBjb21wb25lbnQgaG9va1xuICAgKiAtIGlzIGJlaW5nIGV4aXRlZFxuICAgKlxuICAgKiBJZiBib3RoIGFyZSB0cnVlLCBhZGRzIHRoZSB1aUNhbkV4aXQgY29tcG9uZW50IGZ1bmN0aW9uIGFzIGEgaG9vayB0byB0aGF0IHNpbmd1bGFyIFRyYW5zaXRpb24uXG4gICAqL1xuICBwcml2YXRlIF9pbnZva2VVaUNhbkV4aXRIb29rKHRyYW5zOiBUcmFuc2l0aW9uKSB7XG4gICAgY29uc3QgaW5zdGFuY2UgPSB0aGlzLl9jb21wb25lbnRSZWYgJiYgdGhpcy5fY29tcG9uZW50UmVmLmluc3RhbmNlO1xuICAgIGNvbnN0IHVpQ2FuRXhpdEZuOiBUcmFuc2l0aW9uSG9va0ZuID0gaW5zdGFuY2UgJiYgaW5zdGFuY2UudWlDYW5FeGl0O1xuXG4gICAgaWYgKGlzRnVuY3Rpb24odWlDYW5FeGl0Rm4pKSB7XG4gICAgICBjb25zdCBzdGF0ZTogU3RhdGVEZWNsYXJhdGlvbiA9IHRoaXMuc3RhdGU7XG5cbiAgICAgIGlmICh0cmFucy5leGl0aW5nKCkuaW5kZXhPZihzdGF0ZSkgIT09IC0xKSB7XG4gICAgICAgIHRyYW5zLm9uU3RhcnQoe30sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICByZXR1cm4gdWlDYW5FeGl0Rm4uY2FsbChpbnN0YW5jZSwgdHJhbnMpO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogRm9yIGVhY2ggdHJhbnNpdGlvbiwgY2hlY2tzIGlmIGFueSBwYXJhbSB2YWx1ZXMgY2hhbmdlZCBhbmQgbm90aWZ5IGNvbXBvbmVudFxuICAgKi9cbiAgcHJpdmF0ZSBfaW52b2tlVWlPblBhcmFtc0NoYW5nZWRIb29rKCR0cmFuc2l0aW9uJDogVHJhbnNpdGlvbikge1xuICAgIGNvbnN0IGluc3RhbmNlID0gdGhpcy5fY29tcG9uZW50UmVmICYmIHRoaXMuX2NvbXBvbmVudFJlZi5pbnN0YW5jZTtcbiAgICBjb25zdCB1aU9uUGFyYW1zQ2hhbmdlZDogVHJhbnNpdGlvbkhvb2tGbiA9IGluc3RhbmNlICYmIGluc3RhbmNlLnVpT25QYXJhbXNDaGFuZ2VkO1xuXG4gICAgaWYgKGlzRnVuY3Rpb24odWlPblBhcmFtc0NoYW5nZWQpKSB7XG4gICAgICBjb25zdCB2aWV3U3RhdGU6IFN0YXRlRGVjbGFyYXRpb24gPSB0aGlzLnN0YXRlO1xuICAgICAgY29uc3QgcmVzb2x2ZUNvbnRleHQ6IFJlc29sdmVDb250ZXh0ID0gbmV3IFJlc29sdmVDb250ZXh0KHRoaXMuX3VpVmlld0RhdGEuY29uZmlnLnBhdGgpO1xuICAgICAgY29uc3Qgdmlld0NyZWF0aW9uVHJhbnMgPSByZXNvbHZlQ29udGV4dC5nZXRSZXNvbHZhYmxlKCckdHJhbnNpdGlvbiQnKS5kYXRhO1xuXG4gICAgICAvLyBFeGl0IGVhcmx5IGlmIHRoZSAkdHJhbnNpdGlvbiQgaXMgdGhlIHNhbWUgYXMgdGhlIHZpZXcgd2FzIGNyZWF0ZWQgd2l0aGluLlxuICAgICAgLy8gRXhpdCBlYXJseSBpZiB0aGUgJHRyYW5zaXRpb24kIHdpbGwgZXhpdCB0aGUgc3RhdGUgdGhlIHZpZXcgaXMgZm9yLlxuICAgICAgaWYgKCR0cmFuc2l0aW9uJCA9PT0gdmlld0NyZWF0aW9uVHJhbnMgfHwgJHRyYW5zaXRpb24kLmV4aXRpbmcoKS5pbmRleE9mKHZpZXdTdGF0ZSBhcyBTdGF0ZURlY2xhcmF0aW9uKSAhPT0gLTEpXG4gICAgICAgIHJldHVybjtcblxuICAgICAgY29uc3QgdG9QYXJhbXM6IHsgW3BhcmFtTmFtZTogc3RyaW5nXTogYW55IH0gPSAkdHJhbnNpdGlvbiQucGFyYW1zKCd0bycpO1xuICAgICAgY29uc3QgZnJvbVBhcmFtczogeyBbcGFyYW1OYW1lOiBzdHJpbmddOiBhbnkgfSA9ICR0cmFuc2l0aW9uJC5wYXJhbXMoJ2Zyb20nKTtcbiAgICAgIGNvbnN0IGdldE5vZGVTY2hlbWEgPSAobm9kZTogUGF0aE5vZGUpID0+IG5vZGUucGFyYW1TY2hlbWE7XG4gICAgICBjb25zdCB0b1NjaGVtYTogUGFyYW1bXSA9ICR0cmFuc2l0aW9uJC50cmVlQ2hhbmdlcygndG8nKS5tYXAoZ2V0Tm9kZVNjaGVtYSkucmVkdWNlKHVubmVzdFIsIFtdKTtcbiAgICAgIGNvbnN0IGZyb21TY2hlbWE6IFBhcmFtW10gPSAkdHJhbnNpdGlvbiQudHJlZUNoYW5nZXMoJ2Zyb20nKS5tYXAoZ2V0Tm9kZVNjaGVtYSkucmVkdWNlKHVubmVzdFIsIFtdKTtcblxuICAgICAgLy8gRmluZCB0aGUgdG8gcGFyYW1zIHRoYXQgaGF2ZSBkaWZmZXJlbnQgdmFsdWVzIHRoYW4gdGhlIGZyb20gcGFyYW1zXG4gICAgICBjb25zdCBjaGFuZ2VkVG9QYXJhbXMgPSB0b1NjaGVtYS5maWx0ZXIoKHBhcmFtOiBQYXJhbSkgPT4ge1xuICAgICAgICBjb25zdCBpZHggPSBmcm9tU2NoZW1hLmluZGV4T2YocGFyYW0pO1xuICAgICAgICByZXR1cm4gaWR4ID09PSAtMSB8fCAhZnJvbVNjaGVtYVtpZHhdLnR5cGUuZXF1YWxzKHRvUGFyYW1zW3BhcmFtLmlkXSwgZnJvbVBhcmFtc1twYXJhbS5pZF0pO1xuICAgICAgfSk7XG5cbiAgICAgIC8vIE9ubHkgdHJpZ2dlciBjYWxsYmFjayBpZiBhIHRvIHBhcmFtIGhhcyBjaGFuZ2VkIG9yIGlzIG5ld1xuICAgICAgaWYgKGNoYW5nZWRUb1BhcmFtcy5sZW5ndGgpIHtcbiAgICAgICAgY29uc3QgY2hhbmdlZEtleXM6IHN0cmluZ1tdID0gY2hhbmdlZFRvUGFyYW1zLm1hcCgoeCkgPT4geC5pZCk7XG4gICAgICAgIC8vIEZpbHRlciB0aGUgcGFyYW1zIHRvIG9ubHkgY2hhbmdlZC9uZXcgdG8gcGFyYW1zLiAgYCR0cmFuc2l0aW9uJC5wYXJhbXMoKWAgbWF5IGJlIHVzZWQgdG8gZ2V0IGFsbCBwYXJhbXMuXG4gICAgICAgIGNvbnN0IG5ld1ZhbHVlcyA9IGZpbHRlcih0b1BhcmFtcywgKHZhbCwga2V5KSA9PiBjaGFuZ2VkS2V5cy5pbmRleE9mKGtleSkgIT09IC0xKTtcbiAgICAgICAgaW5zdGFuY2UudWlPblBhcmFtc0NoYW5nZWQobmV3VmFsdWVzLCAkdHJhbnNpdGlvbiQpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgX2Rpc3Bvc2VMYXN0KCkge1xuICAgIGlmICh0aGlzLl9jb21wb25lbnRSZWYpIHRoaXMuX2NvbXBvbmVudFJlZi5kZXN0cm95KCk7XG4gICAgdGhpcy5fY29tcG9uZW50UmVmID0gbnVsbDtcbiAgfVxuXG4gIG5nT25EZXN0cm95KCkge1xuICAgIGlmICh0aGlzLl9kZXJlZ2lzdGVyVUlWaWV3KSB0aGlzLl9kZXJlZ2lzdGVyVUlWaWV3KCk7XG4gICAgaWYgKHRoaXMuX2RlcmVnaXN0ZXJVaUNhbkV4aXRIb29rKSB0aGlzLl9kZXJlZ2lzdGVyVWlDYW5FeGl0SG9vaygpO1xuICAgIGlmICh0aGlzLl9kZXJlZ2lzdGVyVWlPblBhcmFtc0NoYW5nZWRIb29rKSB0aGlzLl9kZXJlZ2lzdGVyVWlPblBhcmFtc0NoYW5nZWRIb29rKCk7XG4gICAgdGhpcy5fZGVyZWdpc3RlclVJVmlldyA9IHRoaXMuX2RlcmVnaXN0ZXJVaUNhbkV4aXRIb29rID0gdGhpcy5fZGVyZWdpc3RlclVpT25QYXJhbXNDaGFuZ2VkSG9vayA9IG51bGw7XG4gICAgdGhpcy5fZGlzcG9zZUxhc3QoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBUaGUgdmlldyBzZXJ2aWNlIGlzIGluZm9ybWluZyB1cyBvZiBhbiB1cGRhdGVkIFZpZXdDb25maWdcbiAgICogKHVzdWFsbHkgYmVjYXVzZSBhIHRyYW5zaXRpb24gYWN0aXZhdGVkIHNvbWUgc3RhdGUgYW5kIGl0cyB2aWV3cylcbiAgICovXG4gIF92aWV3Q29uZmlnVXBkYXRlZChjb25maWc6IFZpZXdDb25maWcpIHtcbiAgICAvLyBUaGUgY29uZmlnIG1heSBiZSB1bmRlZmluZWQgaWYgdGhlcmUgaXMgbm90aGluZyBjdXJyZW50bHkgdGFyZ2V0aW5nIHRoaXMgVUlWaWV3LlxuICAgIC8vIERpc3Bvc2UgdGhlIGN1cnJlbnQgY29tcG9uZW50LCBpZiB0aGVyZSBpcyBvbmVcbiAgICBpZiAoIWNvbmZpZykgcmV0dXJuIHRoaXMuX2Rpc3Bvc2VMYXN0KCk7XG5cbiAgICAvLyBPbmx5IGNhcmUgYWJvdXQgTmcyIGNvbmZpZ3NcbiAgICBpZiAoIShjb25maWcgaW5zdGFuY2VvZiBOZzJWaWV3Q29uZmlnKSkgcmV0dXJuO1xuXG4gICAgLy8gVGhlIFwibmV3XCIgdmlld2NvbmZpZyBpcyBhbHJlYWR5IGFwcGxpZWQsIHNvIGV4aXQgZWFybHlcbiAgICBpZiAodGhpcy5fdWlWaWV3RGF0YS5jb25maWcgPT09IGNvbmZpZykgcmV0dXJuO1xuXG4gICAgLy8gVGhpcyBpcyBhIG5ldyBWaWV3Q29uZmlnLiAgRGlzcG9zZSB0aGUgcHJldmlvdXMgY29tcG9uZW50XG4gICAgdGhpcy5fZGlzcG9zZUxhc3QoKTtcbiAgICB0cmFjZS50cmFjZVVJVmlld0NvbmZpZ1VwZGF0ZWQodGhpcy5fdWlWaWV3RGF0YSwgY29uZmlnICYmIGNvbmZpZy52aWV3RGVjbC4kY29udGV4dCk7XG5cbiAgICB0aGlzLl9hcHBseVVwZGF0ZWRDb25maWcoY29uZmlnKTtcblxuICAgIC8vIEluaXRpYXRlIGNoYW5nZSBkZXRlY3Rpb24gZm9yIHRoZSBuZXdseSBjcmVhdGVkIGNvbXBvbmVudFxuICAgIHRoaXMuX2NvbXBvbmVudFJlZi5jaGFuZ2VEZXRlY3RvclJlZi5tYXJrRm9yQ2hlY2soKTtcbiAgfVxuXG4gIHByaXZhdGUgX2FwcGx5VXBkYXRlZENvbmZpZyhjb25maWc6IE5nMlZpZXdDb25maWcpIHtcbiAgICB0aGlzLl91aVZpZXdEYXRhLmNvbmZpZyA9IGNvbmZpZztcbiAgICAvLyBDcmVhdGUgdGhlIEluamVjdG9yIGZvciB0aGUgcm91dGVkIGNvbXBvbmVudFxuICAgIGNvbnN0IGNvbnRleHQgPSBuZXcgUmVzb2x2ZUNvbnRleHQoY29uZmlnLnBhdGgpO1xuICAgIGNvbnN0IGNvbXBvbmVudEluamVjdG9yID0gdGhpcy5fZ2V0Q29tcG9uZW50SW5qZWN0b3IoY29udGV4dCk7XG5cbiAgICAvLyBHZXQgdGhlIGNvbXBvbmVudCBjbGFzcyBmcm9tIHRoZSB2aWV3IGRlY2xhcmF0aW9uLiBUT0RPOiBhbGxvdyBwcm9taXNlcz9cbiAgICBjb25zdCBjb21wb25lbnRDbGFzcyA9IGNvbmZpZy52aWV3RGVjbC5jb21wb25lbnQ7XG5cbiAgICAvLyBDcmVhdGUgdGhlIGNvbXBvbmVudFxuICAgIGNvbnN0IGNvbXBGYWN0b3J5UmVzb2x2ZXIgPSBjb21wb25lbnRJbmplY3Rvci5nZXQoQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyKTtcbiAgICBjb25zdCBjb21wRmFjdG9yeSA9IGNvbXBGYWN0b3J5UmVzb2x2ZXIucmVzb2x2ZUNvbXBvbmVudEZhY3RvcnkoY29tcG9uZW50Q2xhc3MpO1xuICAgIHRoaXMuX2NvbXBvbmVudFJlZiA9IHRoaXMuX2NvbXBvbmVudFRhcmdldC5jcmVhdGVDb21wb25lbnQoY29tcEZhY3RvcnksIHVuZGVmaW5lZCwgY29tcG9uZW50SW5qZWN0b3IpO1xuXG4gICAgLy8gV2lyZSByZXNvbHZlcyB0byBASW5wdXQoKXNcbiAgICB0aGlzLl9hcHBseUlucHV0QmluZGluZ3MoY29tcEZhY3RvcnksIHRoaXMuX2NvbXBvbmVudFJlZi5pbnN0YW5jZSwgY29udGV4dCwgY29tcG9uZW50Q2xhc3MpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgSW5qZWN0b3IgZm9yIGEgcm91dGVkIGNvbXBvbmVudC5cbiAgICpcbiAgICogQWRkcyByZXNvbHZlIHZhbHVlcyB0byB0aGUgSW5qZWN0b3JcbiAgICogQWRkcyBwcm92aWRlcnMgZnJvbSB0aGUgTmdNb2R1bGUgZm9yIHRoZSBzdGF0ZVxuICAgKiBBZGRzIHByb3ZpZGVycyBmcm9tIHRoZSBwYXJlbnQgQ29tcG9uZW50IGluIHRoZSBjb21wb25lbnQgdHJlZVxuICAgKiBBZGRzIGEgUEFSRU5UX0lOSkVDVCB2aWV3IGNvbnRleHQgb2JqZWN0XG4gICAqXG4gICAqIEByZXR1cm5zIGFuIEluamVjdG9yXG4gICAqL1xuICBwcml2YXRlIF9nZXRDb21wb25lbnRJbmplY3Rvcihjb250ZXh0OiBSZXNvbHZlQ29udGV4dCk6IEluamVjdG9yIHtcbiAgICAvLyBNYXAgcmVzb2x2ZXMgdG8gXCJ1c2VWYWx1ZTogcHJvdmlkZXJzXCJcbiAgICBjb25zdCByZXNvbHZhYmxlcyA9IGNvbnRleHRcbiAgICAgIC5nZXRUb2tlbnMoKVxuICAgICAgLm1hcCgodG9rZW4pID0+IGNvbnRleHQuZ2V0UmVzb2x2YWJsZSh0b2tlbikpXG4gICAgICAuZmlsdGVyKChyKSA9PiByLnJlc29sdmVkKTtcblxuICAgIGNvbnN0IG5ld1Byb3ZpZGVycyA9IHJlc29sdmFibGVzLm1hcCgocikgPT4gKHsgcHJvdmlkZTogci50b2tlbiwgdXNlVmFsdWU6IGNvbnRleHQuaW5qZWN0b3IoKS5nZXQoci50b2tlbikgfSkpO1xuXG4gICAgY29uc3QgcGFyZW50SW5qZWN0ID0geyBjb250ZXh0OiB0aGlzLl91aVZpZXdEYXRhLmNvbmZpZy52aWV3RGVjbC4kY29udGV4dCwgZnFuOiB0aGlzLl91aVZpZXdEYXRhLmZxbiB9O1xuICAgIG5ld1Byb3ZpZGVycy5wdXNoKHsgcHJvdmlkZTogVUlWaWV3LlBBUkVOVF9JTkpFQ1QsIHVzZVZhbHVlOiBwYXJlbnRJbmplY3QgfSk7XG5cbiAgICBjb25zdCBwYXJlbnRDb21wb25lbnRJbmplY3RvciA9IHRoaXMudmlld0NvbnRhaW5lclJlZi5pbmplY3RvcjtcbiAgICBjb25zdCBtb2R1bGVJbmplY3RvciA9IGNvbnRleHQuZ2V0UmVzb2x2YWJsZShOQVRJVkVfSU5KRUNUT1JfVE9LRU4pLmRhdGE7XG4gICAgY29uc3QgbWVyZ2VkUGFyZW50SW5qZWN0b3IgPSBuZXcgTWVyZ2VJbmplY3Rvcihtb2R1bGVJbmplY3RvciwgcGFyZW50Q29tcG9uZW50SW5qZWN0b3IpO1xuXG4gICAgcmV0dXJuIFJlZmxlY3RpdmVJbmplY3Rvci5yZXNvbHZlQW5kQ3JlYXRlKG5ld1Byb3ZpZGVycywgbWVyZ2VkUGFyZW50SW5qZWN0b3IpO1xuICB9XG5cbiAgLyoqXG4gICAqIFN1cHBsaWVzIGNvbXBvbmVudCBpbnB1dHMgd2l0aCByZXNvbHZlIGRhdGFcbiAgICpcbiAgICogRmluZHMgY29tcG9uZW50IGlucHV0cyB3aGljaCBtYXRjaCByZXNvbHZlcyAoYnkgbmFtZSkgYW5kIHNldHMgdGhlIGlucHV0IHZhbHVlXG4gICAqIHRvIHRoZSByZXNvbHZlIGRhdGEuXG4gICAqL1xuICBwcml2YXRlIF9hcHBseUlucHV0QmluZGluZ3MoZmFjdG9yeTogQ29tcG9uZW50RmFjdG9yeTxhbnk+LCBjb21wb25lbnQ6IGFueSwgY29udGV4dDogUmVzb2x2ZUNvbnRleHQsIGNvbXBvbmVudENsYXNzKSB7XG4gICAgY29uc3QgYmluZGluZ3MgPSB0aGlzLl91aVZpZXdEYXRhLmNvbmZpZy52aWV3RGVjbFsnYmluZGluZ3MnXSB8fCB7fTtcbiAgICBjb25zdCBleHBsaWNpdEJvdW5kUHJvcHMgPSBPYmplY3Qua2V5cyhiaW5kaW5ncyk7XG5cbiAgICAvLyBSZXR1cm5zIHRoZSBhY3R1YWwgY29tcG9uZW50IHByb3BlcnR5IGZvciBhIHJlbmFtZWQgYW4gaW5wdXQgcmVuYW1lZCB1c2luZyBgQElucHV0KCdmb28nKSBfZm9vYC5cbiAgICAvLyByZXR1cm4gdGhlIGBfZm9vYCBwcm9wZXJ0eVxuICAgIGNvbnN0IHJlbmFtZWRJbnB1dFByb3AgPSAocHJvcDogc3RyaW5nKSA9PiB7XG4gICAgICBjb25zdCBpbnB1dCA9IGZhY3RvcnkuaW5wdXRzLmZpbmQoKGkpID0+IGkudGVtcGxhdGVOYW1lID09PSBwcm9wKTtcbiAgICAgIHJldHVybiAoaW5wdXQgJiYgaW5wdXQucHJvcE5hbWUpIHx8IHByb3A7XG4gICAgfTtcblxuICAgIC8vIFN1cHBseSByZXNvbHZlIGRhdGEgdG8gY29tcG9uZW50IGFzIHNwZWNpZmllZCBpbiB0aGUgc3RhdGUncyBgYmluZGluZ3M6IHt9YFxuICAgIGNvbnN0IGV4cGxpY2l0SW5wdXRUdXBsZXMgPSBleHBsaWNpdEJvdW5kUHJvcHMucmVkdWNlKFxuICAgICAgKGFjYywga2V5KSA9PiBhY2MuY29uY2F0KFt7IHByb3A6IHJlbmFtZWRJbnB1dFByb3Aoa2V5KSwgdG9rZW46IGJpbmRpbmdzW2tleV0gfV0pLFxuICAgICAgW11cbiAgICApO1xuXG4gICAgLy8gU3VwcGx5IHJlc29sdmUgZGF0YSB0byBtYXRjaGluZyBASW5wdXQoJ3Byb3AnKSBvciBpbnB1dHM6IFsncHJvcCddXG4gICAgY29uc3QgaW1wbGljaXRJbnB1dFR1cGxlcyA9IG5nMkNvbXBvbmVudElucHV0cyhmYWN0b3J5KS5maWx0ZXIoKHR1cGxlKSA9PiAhaW5BcnJheShleHBsaWNpdEJvdW5kUHJvcHMsIHR1cGxlLnByb3ApKTtcblxuICAgIGNvbnN0IGFkZFJlc29sdmFibGUgPSAodHVwbGU6IElucHV0TWFwcGluZykgPT4gKHtcbiAgICAgIHByb3A6IHR1cGxlLnByb3AsXG4gICAgICByZXNvbHZhYmxlOiBjb250ZXh0LmdldFJlc29sdmFibGUodHVwbGUudG9rZW4pLFxuICAgIH0pO1xuXG4gICAgY29uc3QgaW5qZWN0b3IgPSBjb250ZXh0LmluamVjdG9yKCk7XG5cbiAgICBleHBsaWNpdElucHV0VHVwbGVzXG4gICAgICAuY29uY2F0KGltcGxpY2l0SW5wdXRUdXBsZXMpXG4gICAgICAubWFwKGFkZFJlc29sdmFibGUpXG4gICAgICAuZmlsdGVyKCh0dXBsZSkgPT4gdHVwbGUucmVzb2x2YWJsZSAmJiB0dXBsZS5yZXNvbHZhYmxlLnJlc29sdmVkKVxuICAgICAgLmZvckVhY2goKHR1cGxlKSA9PiB7XG4gICAgICAgIGNvbXBvbmVudFt0dXBsZS5wcm9wXSA9IGluamVjdG9yLmdldCh0dXBsZS5yZXNvbHZhYmxlLnRva2VuKTtcbiAgICAgIH0pO1xuICB9XG59XG4iXX0=