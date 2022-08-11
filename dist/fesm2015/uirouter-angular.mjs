import * as i1 from '@uirouter/core';
import { pick, forEach, isFunction, ViewService, services, parse, ResolveContext, unnestR, filter, trace, NATIVE_INJECTOR_TOKEN, inArray, isNullOrUndefined, extend, isNumber, PathUtils, tail, Param, anyTrueR, identity, uniqR, isDefined, UIRouter, Resolvable, BaseLocationServices, parseUrl, BrowserLocationConfig, is, servicesPlugin, StateRegistry, StateService, TransitionService, UrlMatcherFactory, UrlRouter, UrlService, UIRouterGlobals } from '@uirouter/core';
export * from '@uirouter/core';
import * as i0 from '@angular/core';
import { ComponentFactoryResolver, ReflectiveInjector, ViewContainerRef, Component, Inject, ViewChild, Input, Directive, Optional, HostListener, EventEmitter, Host, Self, Output, ContentChildren, InjectionToken, Compiler, NgModuleFactory, PLATFORM_ID, Injector, APP_INITIALIZER, ANALYZE_FOR_ENTRY_COMPONENTS, NgModule } from '@angular/core';
import * as i2 from '@angular/common';
import { PathLocationStrategy, isPlatformBrowser, LocationStrategy, HashLocationStrategy, CommonModule } from '@angular/common';
import { ReplaySubject, of, from, concat, BehaviorSubject, combineLatest } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';
import { UIRouterRx } from '@uirouter/rx';

/**
 * This is a [[StateBuilder.builder]] function for Angular `views`.
 *
 * When the [[StateBuilder]] builds a [[State]] object from a raw [[StateDeclaration]], this builder
 * handles the `views` property with logic specific to @uirouter/angular.
 *
 * If no `views: {}` property exists on the [[StateDeclaration]], then it creates the `views` object and
 * applies the state-level configuration to a view named `$default`.
 */
function ng2ViewsBuilder(state) {
    const views = {}, viewsObject = state.views || { $default: pick(state, ['component', 'bindings']) };
    forEach(viewsObject, function (config, name) {
        name = name || '$default'; // Account for views: { "": { template... } }
        if (isFunction(config))
            config = { component: config };
        if (Object.keys(config).length === 0)
            return;
        config.$type = 'ng2';
        config.$context = state;
        config.$name = name;
        const normalized = ViewService.normalizeUIViewTarget(config.$context, config.$name);
        config.$uiViewName = normalized.uiViewName;
        config.$uiViewContextAnchor = normalized.uiViewContextAnchor;
        views[name] = config;
    });
    return views;
}
let id$1 = 0;
class Ng2ViewConfig {
    constructor(path, viewDecl) {
        this.path = path;
        this.viewDecl = viewDecl;
        this.$id = id$1++;
        this.loaded = true;
    }
    load() {
        return services.$q.when(this);
    }
}

/**
 * Merge two injectors
 *
 * This class implements the Injector ng2 interface but delegates
 * to the Injectors provided in the constructor.
 */
class MergeInjector {
    constructor(...injectors) {
        if (injectors.length < 2)
            throw new Error('pass at least two injectors');
        this.injectors = injectors;
    }
    /**
     * Get the token from the first injector which contains it.
     *
     * Delegates to the first Injector.get().
     * If not found, then delegates to the second Injector (and so forth).
     * If no Injector contains the token, return the `notFoundValue`, or throw.
     *
     * @param token the DI token
     * @param notFoundValue the value to return if none of the Injectors contains the token.
     * @returns {any} the DI value
     */
    get(token, notFoundValue) {
        for (let i = 0; i < this.injectors.length; i++) {
            const val = this.injectors[i].get(token, MergeInjector.NOT_FOUND);
            if (val !== MergeInjector.NOT_FOUND)
                return val;
        }
        if (arguments.length >= 2)
            return notFoundValue;
        // This will throw the DI Injector error
        this.injectors[0].get(token);
    }
}
MergeInjector.NOT_FOUND = {};

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
class UIView {
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
        }], ctorParameters: function () {
        return [{ type: i1.UIRouter }, { type: undefined, decorators: [{
                        type: Inject,
                        args: [UIView.PARENT_INJECT]
                    }] }, { type: i0.ViewContainerRef }];
    }, propDecorators: { _componentTarget: [{
                type: ViewChild,
                args: ['componentTarget', { read: ViewContainerRef, static: true }]
            }], name: [{
                type: Input,
                args: ['name']
            }], _name: [{
                type: Input,
                args: ['ui-view']
            }] } });

/**
 * @internal
 * # blah blah blah
 */
class AnchorUISref {
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
class UISref {
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
        }], ctorParameters: function () {
        return [{ type: i1.UIRouter }, { type: AnchorUISref, decorators: [{
                        type: Optional
                    }] }, { type: undefined, decorators: [{
                        type: Inject,
                        args: [UIView.PARENT_INJECT]
                    }] }];
    }, propDecorators: { state: [{
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

/** @internal */
const inactiveStatus = {
    active: false,
    exact: false,
    entering: false,
    exiting: false,
    targetStates: [],
};
/**
 * Returns a Predicate<PathNode[]>
 *
 * The predicate returns true when the target state (and param values)
 * match the (tail of) the path, and the path's param values
 *
 * @internal
 */
const pathMatches = (target) => {
    if (!target.exists())
        return () => false;
    const state = target.$state();
    const targetParamVals = target.params();
    const targetPath = PathUtils.buildPath(target);
    const paramSchema = targetPath
        .map((node) => node.paramSchema)
        .reduce(unnestR, [])
        .filter((param) => targetParamVals.hasOwnProperty(param.id));
    return (path) => {
        const tailNode = tail(path);
        if (!tailNode || tailNode.state !== state)
            return false;
        const paramValues = PathUtils.paramValues(path);
        return Param.equals(paramSchema, paramValues, targetParamVals);
    };
};
/**
 * Given basePath: [a, b], appendPath: [c, d]),
 * Expands the path to [c], [c, d]
 * Then appends each to [a,b,] and returns: [a, b, c], [a, b, c, d]
 *
 * @internal
 */
function spreadToSubPaths(basePath, appendPath) {
    return appendPath.map((node) => basePath.concat(PathUtils.subPath(appendPath, (n) => n.state === node.state)));
}
/**
 * Given a TransEvt (Transition event: started, success, error)
 * and a UISref Target State, return a SrefStatus object
 * which represents the current status of that Sref:
 * active, activeEq (exact match), entering, exiting
 *
 * @internal
 */
function getSrefStatus(event, srefTarget) {
    const pathMatchesTarget = pathMatches(srefTarget);
    const tc = event.trans.treeChanges();
    const isStartEvent = event.evt === 'start';
    const isSuccessEvent = event.evt === 'success';
    const activePath = isSuccessEvent ? tc.to : tc.from;
    const isActive = () => spreadToSubPaths([], activePath).map(pathMatchesTarget).reduce(anyTrueR, false);
    const isExact = () => pathMatchesTarget(activePath);
    const isEntering = () => spreadToSubPaths(tc.retained, tc.entering).map(pathMatchesTarget).reduce(anyTrueR, false);
    const isExiting = () => spreadToSubPaths(tc.retained, tc.exiting).map(pathMatchesTarget).reduce(anyTrueR, false);
    return {
        active: isActive(),
        exact: isExact(),
        entering: isStartEvent ? isEntering() : false,
        exiting: isStartEvent ? isExiting() : false,
        targetStates: [srefTarget],
    };
}
/** @internal */
function mergeSrefStatus(left, right) {
    return {
        active: left.active || right.active,
        exact: left.exact || right.exact,
        entering: left.entering || right.entering,
        exiting: left.exiting || right.exiting,
        targetStates: left.targetStates.concat(right.targetStates),
    };
}
/**
 * A directive which emits events when a paired [[UISref]] status changes.
 *
 * This directive is primarily used by the [[UISrefActive]] directives to monitor `UISref`(s).
 *
 * This directive shares two attribute selectors with `UISrefActive`:
 *
 * - `[uiSrefActive]`
 * - `[uiSrefActiveEq]`.
 *
 * Thus, whenever a `UISrefActive` directive is created, a `UISrefStatus` directive is also created.
 *
 * Most apps should simply use `UISrefActive`, but some advanced components may want to process the
 * [[SrefStatus]] events directly.
 *
 * ```js
 * <li (uiSrefStatus)="onSrefStatusChanged($event)">
 *   <a uiSref="book" [uiParams]="{ bookId: book.id }">Book {{ book.name }}</a>
 * </li>
 * ```
 *
 * The `uiSrefStatus` event is emitted whenever an enclosed `uiSref`'s status changes.
 * The event emitted is of type [[SrefStatus]], and has boolean values for `active`, `exact`, `entering`, and `exiting`; also has a [[StateOrName]] `identifier`value.
 *
 * The values from this event can be captured and stored on a component (then applied, e.g., using ngClass).
 *
 * ---
 *
 * A single `uiSrefStatus` can enclose multiple `uiSref`.
 * Each status boolean (`active`, `exact`, `entering`, `exiting`) will be true if *any of the enclosed `uiSref` status is true*.
 * In other words, all enclosed `uiSref` statuses  are merged to a single status using `||` (logical or).
 *
 * ```js
 * <li (uiSrefStatus)="onSrefStatus($event)" uiSref="admin">
 *   Home
 *   <ul>
 *     <li> <a uiSref="admin.users">Users</a> </li>
 *     <li> <a uiSref="admin.groups">Groups</a> </li>
 *   </ul>
 * </li>
 * ```
 *
 * In the above example, `$event.active === true` when either `admin.users` or `admin.groups` is active.
 *
 * ---
 *
 * This API is subject to change.
 */
class UISrefStatus {
    constructor(_hostUiSref, _globals) {
        /** current statuses of the state/params the uiSref directive is linking to */
        this.uiSrefStatus = new EventEmitter(false);
        this._globals = _globals;
        this._hostUiSref = _hostUiSref;
        this.status = Object.assign({}, inactiveStatus);
    }
    ngAfterContentInit() {
        // Map each transition start event to a stream of:
        // start -> (success|error)
        const transEvents$ = this._globals.start$.pipe(switchMap((trans) => {
            const event = (evt) => ({ evt, trans });
            const transStart$ = of(event('start'));
            const transResult = trans.promise.then(() => event('success'), () => event('error'));
            const transFinish$ = from(transResult);
            return concat(transStart$, transFinish$);
        }));
        const withHostSref = (childrenSrefs) => childrenSrefs.concat(this._hostUiSref).filter(identity).reduce(uniqR, []);
        // Watch the @ContentChildren UISref[] components and get their target states
        this._srefs$ = new BehaviorSubject(withHostSref(this._srefs.toArray()));
        this._srefChangesSub = this._srefs.changes.subscribe((srefs) => this._srefs$.next(withHostSref(srefs.toArray())));
        const targetStates$ = this._srefs$.pipe(switchMap((srefs) => combineLatest(srefs.map((sref) => sref.targetState$))));
        // Calculate the status of each UISref based on the transition event.
        // Reduce the statuses (if multiple) by or-ing each flag.
        this._subscription = transEvents$
            .pipe(switchMap((evt) => {
            return targetStates$.pipe(map((targets) => {
                const statuses = targets.map((target) => getSrefStatus(evt, target));
                return statuses.reduce(mergeSrefStatus);
            }));
        }))
            .subscribe(this._setStatus.bind(this));
    }
    ngOnDestroy() {
        if (this._subscription)
            this._subscription.unsubscribe();
        if (this._srefChangesSub)
            this._srefChangesSub.unsubscribe();
        if (this._srefs$)
            this._srefs$.unsubscribe();
        this._subscription = this._srefChangesSub = this._srefs$ = undefined;
    }
    _setStatus(status) {
        this.status = status;
        this.uiSrefStatus.emit(status);
    }
}
UISrefStatus.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "14.1.0", ngImport: i0, type: UISrefStatus, deps: [{ token: UISref, host: true, optional: true, self: true }, { token: i1.UIRouterGlobals }], target: i0.ɵɵFactoryTarget.Directive });
UISrefStatus.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "14.1.0", type: UISrefStatus, selector: "[uiSrefStatus],[uiSrefActive],[uiSrefActiveEq]", outputs: { uiSrefStatus: "uiSrefStatus" }, queries: [{ propertyName: "_srefs", predicate: UISref, descendants: true }], exportAs: ["uiSrefStatus"], ngImport: i0 });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "14.1.0", ngImport: i0, type: UISrefStatus, decorators: [{
            type: Directive,
            args: [{
                    selector: '[uiSrefStatus],[uiSrefActive],[uiSrefActiveEq]',
                    exportAs: 'uiSrefStatus',
                }]
        }], ctorParameters: function () {
        return [{ type: UISref, decorators: [{
                        type: Host
                    }, {
                        type: Self
                    }, {
                        type: Optional
                    }] }, { type: i1.UIRouterGlobals }];
    }, propDecorators: { uiSrefStatus: [{
                type: Output,
                args: ['uiSrefStatus']
            }], _srefs: [{
                type: ContentChildren,
                args: [UISref, { descendants: true }]
            }] } });

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
class UISrefActive {
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
UISrefActive.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "14.1.0", ngImport: i0, type: UISrefActive, deps: [{ token: UISrefStatus }, { token: i0.Renderer2 }, { token: i0.ElementRef, host: true }], target: i0.ɵɵFactoryTarget.Directive });
UISrefActive.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "14.1.0", type: UISrefActive, selector: "[uiSrefActive],[uiSrefActiveEq]", inputs: { active: ["uiSrefActive", "active"], activeEq: ["uiSrefActiveEq", "activeEq"] }, ngImport: i0 });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "14.1.0", ngImport: i0, type: UISrefActive, decorators: [{
            type: Directive,
            args: [{
                    selector: '[uiSrefActive],[uiSrefActiveEq]',
                }]
        }], ctorParameters: function () {
        return [{ type: UISrefStatus }, { type: i0.Renderer2 }, { type: i0.ElementRef, decorators: [{
                        type: Host
                    }] }];
    }, propDecorators: { active: [{
                type: Input,
                args: ['uiSrefActive']
            }], activeEq: [{
                type: Input,
                args: ['uiSrefActiveEq']
            }] } });

/** @internal */
const _UIROUTER_DIRECTIVES = [UISref, AnchorUISref, UIView, UISrefActive, UISrefStatus];
/**
 * References to the UI-Router directive classes, for use within a @Component's `directives:` property
 * @deprecated use [[UIRouterModule]]
 * @internal
 */
const UIROUTER_DIRECTIVES = _UIROUTER_DIRECTIVES;

/** @hidden */ const UIROUTER_ROOT_MODULE = new InjectionToken('UIRouter Root Module');
/** @hidden */ const UIROUTER_MODULE_TOKEN = new InjectionToken('UIRouter Module');
/** @hidden */ const UIROUTER_STATES = new InjectionToken('UIRouter States');

function applyModuleConfig(uiRouter, injector, module = {}) {
    if (isFunction(module.config)) {
        module.config(uiRouter, injector, module);
    }
    const states = module.states || [];
    return states.map((state) => uiRouter.stateRegistry.register(state));
}
function applyRootModuleConfig(uiRouter, injector, module) {
    isDefined(module.deferIntercept) && uiRouter.urlService.deferIntercept(module.deferIntercept);
    isDefined(module.otherwise) && uiRouter.urlService.rules.otherwise(module.otherwise);
    isDefined(module.initial) && uiRouter.urlService.rules.initial(module.initial);
}

/**
 * Returns a function which lazy loads a nested module
 *
 * This is primarily used by the [[ng2LazyLoadBuilder]] when processing [[Ng2StateDeclaration.loadChildren]].
 *
 * It could also be used manually as a [[StateDeclaration.lazyLoad]] property to lazy load an `NgModule` and its state(s).
 *
 * #### Example:
 * Using `import()` and named export of `HomeModule`
 * ```js
 * declare var System;
 * var futureState = {
 *   name: 'home.**',
 *   url: '/home',
 *   lazyLoad: loadNgModule(() => import('./home/home.module').then(result => result.HomeModule))
 * }
 * ```
 *
 * #### Example:
 * Using a path (string) to the module
 * ```js
 * var futureState = {
 *   name: 'home.**',
 *   url: '/home',
 *   lazyLoad: loadNgModule('./home/home.module#HomeModule')
 * }
 * ```
 *
 *
 * @param moduleToLoad a path (string) to the NgModule to load.
 *    Or a function which loads the NgModule code which should
 *    return a reference to  the `NgModule` class being loaded (or a `Promise` for it).
 *
 * @returns A function which takes a transition, which:
 * - Gets the Injector (scoped properly for the destination state)
 * - Loads and creates the NgModule
 * - Finds the "replacement state" for the target state, and adds the new NgModule Injector to it (as a resolve)
 * - Returns the new states array
 */
function loadNgModule(moduleToLoad) {
    return (transition, stateObject) => {
        const ng2Injector = transition.injector().get(NATIVE_INJECTOR_TOKEN);
        const createModule = (factory) => factory.create(ng2Injector);
        const applyModule = (moduleRef) => applyNgModule(transition, moduleRef, ng2Injector, stateObject);
        return loadModuleFactory(moduleToLoad, ng2Injector).then(createModule).then(applyModule);
    };
}
/**
 * Returns the module factory that can be used to instantiate a module
 *
 * For a Type<any> or Promise<Type<any>> this:
 * - Compiles the component type (if not running with AOT)
 * - Returns the NgModuleFactory resulting from compilation (or direct loading if using AOT) as a Promise
 *
 * @internal
 */
function loadModuleFactory(moduleToLoad, ng2Injector) {
    const compiler = ng2Injector.get(Compiler);
    const unwrapEsModuleDefault = (x) => (x && x.__esModule && x['default'] ? x['default'] : x);
    return Promise.resolve(moduleToLoad())
        .then(unwrapEsModuleDefault)
        .then((t) => {
        if (t instanceof NgModuleFactory) {
            return t;
        }
        return compiler.compileModuleAsync(t);
    });
}
/**
 * Apply the UI-Router Modules found in the lazy loaded module.
 *
 * Apply the Lazy Loaded NgModule's newly created Injector to the right state in the state tree.
 *
 * Lazy loading uses a placeholder state which is removed (and replaced) after the module is loaded.
 * The NgModule should include a state with the same name as the placeholder.
 *
 * Find the *newly loaded state* with the same name as the *placeholder state*.
 * The NgModule's Injector (and ComponentFactoryResolver) will be added to that state.
 * The Injector/Factory are used when creating Components for the `replacement` state and all its children.
 *
 * @internal
 */
function applyNgModule(transition, ng2Module, parentInjector, lazyLoadState) {
    const injector = ng2Module.injector;
    const uiRouter = injector.get(UIRouter);
    const registry = uiRouter.stateRegistry;
    const originalName = lazyLoadState.name;
    const originalState = registry.get(originalName);
    // Check if it's a future state (ends with .**)
    const isFuture = /^(.*)\.\*\*$/.exec(originalName);
    // Final name (without the .**)
    const replacementName = isFuture && isFuture[1];
    const newRootModules = multiProviderParentChildDelta(parentInjector, injector, UIROUTER_ROOT_MODULE).reduce(uniqR, []);
    const newChildModules = multiProviderParentChildDelta(parentInjector, injector, UIROUTER_MODULE_TOKEN).reduce(uniqR, []);
    if (newRootModules.length) {
        console.log(newRootModules); // tslint:disable-line:no-console
        throw new Error('Lazy loaded modules should not contain a UIRouterModule.forRoot() module');
    }
    const newStateObjects = newChildModules
        .map((module) => applyModuleConfig(uiRouter, injector, module))
        .reduce(unnestR, [])
        .reduce(uniqR, []);
    if (isFuture) {
        const replacementState = registry.get(replacementName);
        if (!replacementState || replacementState === originalState) {
            throw new Error(`The Future State named '${originalName}' lazy loaded an NgModule. ` +
                `The lazy loaded NgModule must have a state named '${replacementName}' ` +
                `which replaces the (placeholder) '${originalName}' Future State. ` +
                `Add a '${replacementName}' state to the lazy loaded NgModule ` +
                `using UIRouterModule.forChild({ states: CHILD_STATES }).`);
        }
    }
    // Supply the newly loaded states with the Injector from the lazy loaded NgModule.
    // If a tree of states is lazy loaded, only add the injector to the root of the lazy loaded tree.
    // The children will get the injector by resolve inheritance.
    const newParentStates = newStateObjects.filter((state) => !inArray(newStateObjects, state.parent));
    // Add the Injector to the top of the lazy loaded state tree as a resolve
    newParentStates.forEach((state) => state.resolvables.push(Resolvable.fromData(NATIVE_INJECTOR_TOKEN, injector)));
    return {};
}
/**
 * Returns the new dependency injection values from the Child Injector
 *
 * When a DI token is defined as multi: true, the child injector
 * can add new values for the token.
 *
 * This function returns the values added by the child injector,  and excludes all values from the parent injector.
 *
 * @internal
 */
function multiProviderParentChildDelta(parent, child, token) {
    const childVals = child.get(token, []);
    const parentVals = parent.get(token, []);
    return childVals.filter((val) => parentVals.indexOf(val) === -1);
}

/**
 * This is a [[StateBuilder.builder]] function for ngModule lazy loading in Angular.
 *
 * When the [[StateBuilder]] builds a [[State]] object from a raw [[StateDeclaration]], this builder
 * decorates the `lazyLoad` property for states that have a [[Ng2StateDeclaration.ngModule]] declaration.
 *
 * If the state has a [[Ng2StateDeclaration.ngModule]], it will create a `lazyLoad` function
 * that in turn calls `loadNgModule(loadNgModuleFn)`.
 *
 * #### Example:
 * A state that has a `ngModule`
 * ```js
 * var decl = {
 *   ngModule: () => import('./childModule.ts')
 * }
 * ```
 * would build a state with a `lazyLoad` function like:
 * ```js
 * import { loadNgModule } from "@uirouter/angular";
 * var decl = {
 *   lazyLoad: loadNgModule(() => import('./childModule.ts')
 * }
 * ```
 *
 * If the state has both a `ngModule:` *and* a `lazyLoad`, then the `lazyLoad` is run first.
 *
 * #### Example:
 * ```js
 * var decl = {
 *   lazyLoad: () => import('third-party-library'),
 *   ngModule: () => import('./childModule.ts')
 * }
 * ```
 * would build a state with a `lazyLoad` function like:
 * ```js
 * import { loadNgModule } from "@uirouter/angular";
 * var decl = {
 *   lazyLoad: () => import('third-party-library')
 *       .then(() => loadNgModule(() => import('./childModule.ts'))
 * }
 * ```
 *
 */
function ng2LazyLoadBuilder(state, parent) {
    const loadNgModuleFn = state['loadChildren'];
    return loadNgModuleFn ? loadNgModule(loadNgModuleFn) : state.lazyLoad;
}

/** A `LocationServices` that delegates to the Angular LocationStrategy */
class Ng2LocationServices extends BaseLocationServices {
    constructor(router, _locationStrategy, isBrowser) {
        super(router, isBrowser);
        this._locationStrategy = _locationStrategy;
        this._locationStrategy.onPopState((evt) => {
            if (evt.type !== 'hashchange') {
                this._listener(evt);
            }
        });
    }
    _get() {
        return this._locationStrategy.path(true).replace(this._locationStrategy.getBaseHref().replace(/\/$/, ''), '');
    }
    _set(state, title, url, replace) {
        const { path, search, hash } = parseUrl(url);
        const hashWithPrefix = hash ? '#' + hash : '';
        let urlPath = path;
        let urlParams = search;
        if (search) {
            urlParams += hashWithPrefix;
        }
        else {
            urlPath += hashWithPrefix;
        }
        if (replace) {
            this._locationStrategy.replaceState(state, title, urlPath, urlParams);
        }
        else {
            this._locationStrategy.pushState(state, title, urlPath, urlParams);
        }
    }
    dispose(router) {
        super.dispose(router);
    }
}

class Ng2LocationConfig extends BrowserLocationConfig {
    constructor(router, _locationStrategy) {
        super(router, is(PathLocationStrategy)(_locationStrategy));
        this._locationStrategy = _locationStrategy;
    }
    baseHref(href) {
        return this._locationStrategy.getBaseHref();
    }
}

/**
 * # UI-Router for Angular (v2+)
 *
 * - [@uirouter/angular home page](https://ui-router.github.io/ng2)
 * - [tutorials](https://ui-router.github.io/tutorial/ng2/helloworld)
 * - [quick start repository](http://github.com/ui-router/quickstart-ng2)
 *
 * Getting started:
 *
 * - Use npm. Add a dependency on latest `@uirouter/angular`
 * - Import UI-Router classes directly from `"@uirouter/angular"`
 *
 * ```js
 * import {StateRegistry} from "@uirouter/angular";
 * ```
 *
 * - Create application states (as defined by [[Ng2StateDeclaration]]).
 *
 * ```js
 * export let state1: Ng2StateDeclaration = {
 *   name: 'state1',
 *   component: State1Component,
 *   url: '/one'
 * }
 *
 * export let state2: Ng2StateDeclaration = {
 *   name: 'state2',
 *   component: State2Component,
 *   url: '/two'
 * }
 * ```
 *
 * - Import a [[UIRouterModule.forChild]] module into your feature `NgModule`s.
 *
 * ```js
 * @ NgModule({
 *   imports: [
 *     SharedModule,
 *     UIRouterModule.forChild({ states: [state1, state2 ] })
 *   ],
 *   declarations: [
 *     State1Component,
 *     State2Component,
 *   ]
 * })
 * export class MyFeatureModule {}
 * ```
 *
 * - Import a [[UIRouterModule.forRoot]] module into your application root `NgModule`
 * - Either bootstrap a [[UIView]] component, or add a `<ui-view></ui-view>` viewport to your root component.
 *
 * ```js
 * @ NgModule({
 *   imports: [
 *     BrowserModule,
 *     UIRouterModule.forRoot({ states: [ homeState ] }),
 *     MyFeatureModule,
 *   ],
 *   declarations: [
 *     HomeComponent
 *   ]
 *   bootstrap: [ UIView ]
 * })
 * class RootAppModule {}
 *
 * browserPlatformDynamic.bootstrapModule(RootAppModule);
 * ```
 *
 * - Optionally specify a configuration class [[ChildModule.configClass]] for any module
 * to perform any router configuration during bootstrap or lazyload.
 * Pass the class to [[UIRouterModule.forRoot]] or [[UIRouterModule.forChild]].
 *
 * ```js
 * import {UIRouter} from "@uirouter/angular";
 *
 * @ Injectable()
 * export class MyUIRouterConfig {
 *   // Constructor is injectable
 *   constructor(uiRouter: UIRouter) {
 *     uiRouter.urlMatcherFactory.type('datetime', myDateTimeParamType);
 *   }
 * }
 * ```
 */
/**
 * This is a factory function for a UIRouter instance
 *
 * Creates a UIRouter instance and configures it for Angular, then invokes router bootstrap.
 * This function is used as an Angular `useFactory` Provider.
 */
function uiRouterFactory(locationStrategy, rootModules, modules, injector) {
    if (rootModules.length !== 1) {
        throw new Error("Exactly one UIRouterModule.forRoot() should be in the bootstrapped app module's imports: []");
    }
    // ----------------- Create router -----------------
    // Create a new ng2 UIRouter and configure it for ng2
    const router = new UIRouter();
    // Add RxJS plugin
    router.plugin(UIRouterRx);
    // Add $q-like and $injector-like service APIs
    router.plugin(servicesPlugin);
    // ----------------- Monkey Patches ----------------
    // Monkey patch the services.$injector to use the root ng2 Injector
    services.$injector.get = injector.get.bind(injector);
    // ----------------- Configure for ng2 -------------
    router.locationService = new Ng2LocationServices(router, locationStrategy, isPlatformBrowser(injector.get(PLATFORM_ID)));
    router.locationConfig = new Ng2LocationConfig(router, locationStrategy);
    // Apply ng2 ui-view handling code
    const viewConfigFactory = (path, config) => new Ng2ViewConfig(path, config);
    router.viewService._pluginapi._viewConfigFactory('ng2', viewConfigFactory);
    // Apply statebuilder decorator for ng2 NgModule registration
    const registry = router.stateRegistry;
    registry.decorator('views', ng2ViewsBuilder);
    registry.decorator('lazyLoad', ng2LazyLoadBuilder);
    // Prep the tree of NgModule by placing the root NgModule's Injector on the root state.
    const ng2InjectorResolvable = Resolvable.fromData(NATIVE_INJECTOR_TOKEN, injector);
    registry.root().resolvables.push(ng2InjectorResolvable);
    // Auto-flush the parameter type queue
    router.urlMatcherFactory.$get();
    // ----------------- Initialize router -------------
    rootModules.forEach((moduleConfig) => applyRootModuleConfig(router, injector, moduleConfig));
    modules.forEach((moduleConfig) => applyModuleConfig(router, injector, moduleConfig));
    return router;
}
// Start monitoring the URL when the app starts
function appInitializer(router) {
    return () => {
        if (!router.urlRouter.interceptDeferred) {
            router.urlService.listen();
            router.urlService.sync();
        }
    };
}
function parentUIViewInjectFactory(r) {
    return { fqn: null, context: r.root() };
}
const _UIROUTER_INSTANCE_PROVIDERS = [
    {
        provide: UIRouter,
        useFactory: uiRouterFactory,
        deps: [LocationStrategy, UIROUTER_ROOT_MODULE, UIROUTER_MODULE_TOKEN, Injector],
    },
    { provide: UIView.PARENT_INJECT, useFactory: parentUIViewInjectFactory, deps: [StateRegistry] },
    { provide: APP_INITIALIZER, useFactory: appInitializer, deps: [UIRouter], multi: true },
];
function fnStateService(r) {
    return r.stateService;
}
function fnTransitionService(r) {
    return r.transitionService;
}
function fnUrlMatcherFactory(r) {
    return r.urlMatcherFactory;
}
function fnUrlRouter(r) {
    return r.urlRouter;
}
function fnUrlService(r) {
    return r.urlService;
}
function fnViewService(r) {
    return r.viewService;
}
function fnStateRegistry(r) {
    return r.stateRegistry;
}
function fnGlobals(r) {
    return r.globals;
}
const _UIROUTER_SERVICE_PROVIDERS = [
    { provide: StateService, useFactory: fnStateService, deps: [UIRouter] },
    { provide: TransitionService, useFactory: fnTransitionService, deps: [UIRouter] },
    { provide: UrlMatcherFactory, useFactory: fnUrlMatcherFactory, deps: [UIRouter] },
    { provide: UrlRouter, useFactory: fnUrlRouter, deps: [UIRouter] },
    { provide: UrlService, useFactory: fnUrlService, deps: [UIRouter] },
    { provide: ViewService, useFactory: fnViewService, deps: [UIRouter] },
    { provide: StateRegistry, useFactory: fnStateRegistry, deps: [UIRouter] },
    { provide: UIRouterGlobals, useFactory: fnGlobals, deps: [UIRouter] },
];
/**
 * The UI-Router providers, for use in your application bootstrap
 *
 * @deprecated use [[UIRouterModule.forRoot]]
 */
const UIROUTER_PROVIDERS = _UIROUTER_INSTANCE_PROVIDERS.concat(_UIROUTER_SERVICE_PROVIDERS);

// Delay angular bootstrap until first transition is successful, for SSR.
// See https://github.com/ui-router/angular/pull/127
function onTransitionReady(transitionService, root) {
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
function makeRootProviders(module) {
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
function makeChildProviders(module) {
    return [
        { provide: UIROUTER_MODULE_TOKEN, useValue: module, multi: true },
        { provide: ANALYZE_FOR_ENTRY_COMPONENTS, useValue: module.states || [], multi: true },
    ];
}
function locationStrategy(useHash) {
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
class UIRouterModule {
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
UIRouterModule.ɵmod = i0.ɵɵngDeclareNgModule({ minVersion: "14.0.0", version: "14.1.0", ngImport: i0, type: UIRouterModule, declarations: [UISref, AnchorUISref, UIView, UISrefActive, UISrefStatus], imports: [CommonModule], exports: [UISref, AnchorUISref, UIView, UISrefActive, UISrefStatus] });
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

/**
 * Generated bundle index. Do not edit.
 */

export { AnchorUISref, Ng2ViewConfig, UIROUTER_DIRECTIVES, UIROUTER_MODULE_TOKEN, UIROUTER_PROVIDERS, UIROUTER_ROOT_MODULE, UIROUTER_STATES, UIRouterModule, UISref, UISrefActive, UISrefStatus, UIView, _UIROUTER_DIRECTIVES, _UIROUTER_INSTANCE_PROVIDERS, _UIROUTER_SERVICE_PROVIDERS, appInitializer, applyModuleConfig, applyNgModule, applyRootModuleConfig, fnGlobals, fnStateRegistry, fnStateService, fnTransitionService, fnUrlMatcherFactory, fnUrlRouter, fnUrlService, fnViewService, loadModuleFactory, loadNgModule, locationStrategy, makeChildProviders, makeRootProviders, multiProviderParentChildDelta, ng2LazyLoadBuilder, ng2ViewsBuilder, onTransitionReady, parentUIViewInjectFactory, uiRouterFactory };
//# sourceMappingURL=uirouter-angular.mjs.map
