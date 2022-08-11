import { Directive, Output, EventEmitter, ContentChildren, Host, Self, Optional } from '@angular/core';
import { UISref } from './uiSref';
import { anyTrueR, tail, unnestR, Param, PathUtils, identity, uniqR, } from '@uirouter/core';
import { BehaviorSubject, of, from, combineLatest, concat } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';
import * as i0 from "@angular/core";
import * as i1 from "./uiSref";
import * as i2 from "@uirouter/core";
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
export class UISrefStatus {
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
UISrefStatus.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "14.1.0", ngImport: i0, type: UISrefStatus, deps: [{ token: i1.UISref, host: true, optional: true, self: true }, { token: i2.UIRouterGlobals }], target: i0.ɵɵFactoryTarget.Directive });
UISrefStatus.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "14.1.0", type: UISrefStatus, selector: "[uiSrefStatus],[uiSrefActive],[uiSrefActiveEq]", outputs: { uiSrefStatus: "uiSrefStatus" }, queries: [{ propertyName: "_srefs", predicate: UISref, descendants: true }], exportAs: ["uiSrefStatus"], ngImport: i0 });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "14.1.0", ngImport: i0, type: UISrefStatus, decorators: [{
            type: Directive,
            args: [{
                    selector: '[uiSrefStatus],[uiSrefActive],[uiSrefActiveEq]',
                    exportAs: 'uiSrefStatus',
                }]
        }], ctorParameters: function () { return [{ type: i1.UISref, decorators: [{
                    type: Host
                }, {
                    type: Self
                }, {
                    type: Optional
                }] }, { type: i2.UIRouterGlobals }]; }, propDecorators: { uiSrefStatus: [{
                type: Output,
                args: ['uiSrefStatus']
            }], _srefs: [{
                type: ContentChildren,
                args: [UISref, { descendants: true }]
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidWlTcmVmU3RhdHVzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2RpcmVjdGl2ZXMvdWlTcmVmU3RhdHVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxTQUFTLEVBQUUsTUFBTSxFQUFFLFlBQVksRUFBRSxlQUFlLEVBQWEsSUFBSSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsTUFBTSxlQUFlLENBQUM7QUFDbEgsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLFVBQVUsQ0FBQztBQUNsQyxPQUFPLEVBS0wsUUFBUSxFQUNSLElBQUksRUFDSixPQUFPLEVBR1AsS0FBSyxFQUNMLFNBQVMsRUFDVCxRQUFRLEVBQ1IsS0FBSyxHQUNOLE1BQU0sZ0JBQWdCLENBQUM7QUFFeEIsT0FBTyxFQUE0QixlQUFlLEVBQUUsRUFBRSxFQUFFLElBQUksRUFBRSxhQUFhLEVBQUUsTUFBTSxFQUFFLE1BQU0sTUFBTSxDQUFDO0FBQ2xHLE9BQU8sRUFBRSxTQUFTLEVBQUUsR0FBRyxFQUFPLE1BQU0sZ0JBQWdCLENBQUM7Ozs7QUF3QnJELGdCQUFnQjtBQUNoQixNQUFNLGNBQWMsR0FBZTtJQUNqQyxNQUFNLEVBQUUsS0FBSztJQUNiLEtBQUssRUFBRSxLQUFLO0lBQ1osUUFBUSxFQUFFLEtBQUs7SUFDZixPQUFPLEVBQUUsS0FBSztJQUNkLFlBQVksRUFBRSxFQUFFO0NBQ2pCLENBQUM7QUFFRjs7Ozs7OztHQU9HO0FBQ0gsTUFBTSxXQUFXLEdBQUcsQ0FBQyxNQUFtQixFQUF5QixFQUFFO0lBQ2pFLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFO1FBQUUsT0FBTyxHQUFHLEVBQUUsQ0FBQyxLQUFLLENBQUM7SUFDekMsTUFBTSxLQUFLLEdBQWdCLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQztJQUMzQyxNQUFNLGVBQWUsR0FBRyxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUM7SUFDeEMsTUFBTSxVQUFVLEdBQWUsU0FBUyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUMzRCxNQUFNLFdBQVcsR0FBWSxVQUFVO1NBQ3BDLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQztTQUMvQixNQUFNLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQztTQUNuQixNQUFNLENBQUMsQ0FBQyxLQUFZLEVBQUUsRUFBRSxDQUFDLGVBQWUsQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFFdEUsT0FBTyxDQUFDLElBQWdCLEVBQUUsRUFBRTtRQUMxQixNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDNUIsSUFBSSxDQUFDLFFBQVEsSUFBSSxRQUFRLENBQUMsS0FBSyxLQUFLLEtBQUs7WUFBRSxPQUFPLEtBQUssQ0FBQztRQUN4RCxNQUFNLFdBQVcsR0FBRyxTQUFTLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2hELE9BQU8sS0FBSyxDQUFDLE1BQU0sQ0FBQyxXQUFXLEVBQUUsV0FBVyxFQUFFLGVBQWUsQ0FBQyxDQUFDO0lBQ2pFLENBQUMsQ0FBQztBQUNKLENBQUMsQ0FBQztBQUVGOzs7Ozs7R0FNRztBQUNILFNBQVMsZ0JBQWdCLENBQUMsUUFBb0IsRUFBRSxVQUFzQjtJQUNwRSxPQUFPLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLEtBQUssSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNqSCxDQUFDO0FBRUQ7Ozs7Ozs7R0FPRztBQUNILFNBQVMsYUFBYSxDQUFDLEtBQWUsRUFBRSxVQUF1QjtJQUM3RCxNQUFNLGlCQUFpQixHQUFHLFdBQVcsQ0FBQyxVQUFVLENBQUMsQ0FBQztJQUNsRCxNQUFNLEVBQUUsR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLFdBQVcsRUFBRSxDQUFDO0lBRXJDLE1BQU0sWUFBWSxHQUFHLEtBQUssQ0FBQyxHQUFHLEtBQUssT0FBTyxDQUFDO0lBQzNDLE1BQU0sY0FBYyxHQUFHLEtBQUssQ0FBQyxHQUFHLEtBQUssU0FBUyxDQUFDO0lBQy9DLE1BQU0sVUFBVSxHQUFlLGNBQWMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQztJQUVoRSxNQUFNLFFBQVEsR0FBRyxHQUFHLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLEVBQUUsVUFBVSxDQUFDLENBQUMsR0FBRyxDQUFDLGlCQUFpQixDQUFDLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUV2RyxNQUFNLE9BQU8sR0FBRyxHQUFHLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBQyxVQUFVLENBQUMsQ0FBQztJQUVwRCxNQUFNLFVBQVUsR0FBRyxHQUFHLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLENBQUMsUUFBUSxFQUFFLEVBQUUsQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBRW5ILE1BQU0sU0FBUyxHQUFHLEdBQUcsRUFBRSxDQUFDLGdCQUFnQixDQUFDLEVBQUUsQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUFDLE9BQU8sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFFakgsT0FBTztRQUNMLE1BQU0sRUFBRSxRQUFRLEVBQUU7UUFDbEIsS0FBSyxFQUFFLE9BQU8sRUFBRTtRQUNoQixRQUFRLEVBQUUsWUFBWSxDQUFDLENBQUMsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSztRQUM3QyxPQUFPLEVBQUUsWUFBWSxDQUFDLENBQUMsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSztRQUMzQyxZQUFZLEVBQUUsQ0FBQyxVQUFVLENBQUM7S0FDYixDQUFDO0FBQ2xCLENBQUM7QUFFRCxnQkFBZ0I7QUFDaEIsU0FBUyxlQUFlLENBQUMsSUFBZ0IsRUFBRSxLQUFpQjtJQUMxRCxPQUFPO1FBQ0wsTUFBTSxFQUFFLElBQUksQ0FBQyxNQUFNLElBQUksS0FBSyxDQUFDLE1BQU07UUFDbkMsS0FBSyxFQUFFLElBQUksQ0FBQyxLQUFLLElBQUksS0FBSyxDQUFDLEtBQUs7UUFDaEMsUUFBUSxFQUFFLElBQUksQ0FBQyxRQUFRLElBQUksS0FBSyxDQUFDLFFBQVE7UUFDekMsT0FBTyxFQUFFLElBQUksQ0FBQyxPQUFPLElBQUksS0FBSyxDQUFDLE9BQU87UUFDdEMsWUFBWSxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUM7S0FDM0QsQ0FBQztBQUNKLENBQUM7QUFFRDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0ErQ0c7QUFLSCxNQUFNLE9BQU8sWUFBWTtJQWV2QixZQUF3QyxXQUFtQixFQUFFLFFBQXlCO1FBZHRGLDhFQUE4RTtRQUN0RCxpQkFBWSxHQUFHLElBQUksWUFBWSxDQUFhLEtBQUssQ0FBQyxDQUFDO1FBY3pFLElBQUksQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDO1FBQ3pCLElBQUksQ0FBQyxXQUFXLEdBQUcsV0FBVyxDQUFDO1FBQy9CLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxFQUFFLEVBQUUsY0FBYyxDQUFDLENBQUM7SUFDbEQsQ0FBQztJQUVELGtCQUFrQjtRQUNoQixrREFBa0Q7UUFDbEQsMkJBQTJCO1FBQzNCLE1BQU0sWUFBWSxHQUF5QixJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQ2xFLFNBQVMsQ0FBQyxDQUFDLEtBQWlCLEVBQUUsRUFBRTtZQUM5QixNQUFNLEtBQUssR0FBRyxDQUFDLEdBQVcsRUFBRSxFQUFFLENBQUMsQ0FBQyxFQUFFLEdBQUcsRUFBRSxLQUFLLEVBQWUsQ0FBQSxDQUFDO1lBRTVELE1BQU0sV0FBVyxHQUFHLEVBQUUsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztZQUN2QyxNQUFNLFdBQVcsR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDLElBQUksQ0FDcEMsR0FBRyxFQUFFLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxFQUN0QixHQUFHLEVBQUUsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQ3JCLENBQUM7WUFDRixNQUFNLFlBQVksR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7WUFFdkMsT0FBTyxNQUFNLENBQUMsV0FBVyxFQUFFLFlBQVksQ0FBQyxDQUFDO1FBQzNDLENBQUMsQ0FBQyxDQUNILENBQUM7UUFFRixNQUFNLFlBQVksR0FBRyxDQUFDLGFBQXVCLEVBQUUsRUFBRSxDQUMvQyxhQUFhLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FBQztRQUU1RSw2RUFBNkU7UUFDN0UsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLGVBQWUsQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDeEUsSUFBSSxDQUFDLGVBQWUsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQyxLQUF3QixFQUFFLEVBQUUsQ0FDaEYsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQ2pELENBQUM7UUFFRixNQUFNLGFBQWEsR0FBOEIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQ2hFLFNBQVMsQ0FBQyxDQUFDLEtBQWUsRUFBRSxFQUFFLENBQUMsYUFBYSxDQUFnQixLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUNyRyxDQUFDO1FBRUYscUVBQXFFO1FBQ3JFLHlEQUF5RDtRQUN6RCxJQUFJLENBQUMsYUFBYSxHQUFHLFlBQVk7YUFDOUIsSUFBSSxDQUNILFNBQVMsQ0FBQyxDQUFDLEdBQWEsRUFBRSxFQUFFO1lBQzFCLE9BQU8sYUFBYSxDQUFDLElBQUksQ0FDdkIsR0FBRyxDQUFDLENBQUMsT0FBc0IsRUFBRSxFQUFFO2dCQUM3QixNQUFNLFFBQVEsR0FBaUIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsYUFBYSxDQUFDLEdBQUcsRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDO2dCQUNuRixPQUFPLFFBQVEsQ0FBQyxNQUFNLENBQUMsZUFBZSxDQUFDLENBQUM7WUFDMUMsQ0FBQyxDQUFDLENBQ0gsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUNIO2FBQ0EsU0FBUyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7SUFDM0MsQ0FBQztJQUVELFdBQVc7UUFDVCxJQUFJLElBQUksQ0FBQyxhQUFhO1lBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxXQUFXLEVBQUUsQ0FBQztRQUN6RCxJQUFJLElBQUksQ0FBQyxlQUFlO1lBQUUsSUFBSSxDQUFDLGVBQWUsQ0FBQyxXQUFXLEVBQUUsQ0FBQztRQUM3RCxJQUFJLElBQUksQ0FBQyxPQUFPO1lBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxXQUFXLEVBQUUsQ0FBQztRQUM3QyxJQUFJLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQyxlQUFlLEdBQUcsSUFBSSxDQUFDLE9BQU8sR0FBRyxTQUFTLENBQUM7SUFDdkUsQ0FBQztJQUVPLFVBQVUsQ0FBQyxNQUFrQjtRQUNuQyxJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztRQUNyQixJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUNqQyxDQUFDOzt5R0E5RVUsWUFBWTs2RkFBWixZQUFZLHdKQUlOLE1BQU07MkZBSlosWUFBWTtrQkFKeEIsU0FBUzttQkFBQztvQkFDVCxRQUFRLEVBQUUsZ0RBQWdEO29CQUMxRCxRQUFRLEVBQUUsY0FBYztpQkFDekI7OzBCQWdCYyxJQUFJOzswQkFBSSxJQUFJOzswQkFBSSxRQUFROzBFQWJiLFlBQVk7c0JBQW5DLE1BQU07dUJBQUMsY0FBYztnQkFHZCxNQUFNO3NCQURiLGVBQWU7dUJBQUMsTUFBTSxFQUFFLEVBQUUsV0FBVyxFQUFFLElBQUksRUFBRSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IERpcmVjdGl2ZSwgT3V0cHV0LCBFdmVudEVtaXR0ZXIsIENvbnRlbnRDaGlsZHJlbiwgUXVlcnlMaXN0LCBIb3N0LCBTZWxmLCBPcHRpb25hbCB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHsgVUlTcmVmIH0gZnJvbSAnLi91aVNyZWYnO1xuaW1wb3J0IHtcbiAgUGF0aE5vZGUsXG4gIFRyYW5zaXRpb24sXG4gIFRhcmdldFN0YXRlLFxuICBTdGF0ZU9iamVjdCxcbiAgYW55VHJ1ZVIsXG4gIHRhaWwsXG4gIHVubmVzdFIsXG4gIFByZWRpY2F0ZSxcbiAgVUlSb3V0ZXJHbG9iYWxzLFxuICBQYXJhbSxcbiAgUGF0aFV0aWxzLFxuICBpZGVudGl0eSxcbiAgdW5pcVIsXG59IGZyb20gJ0B1aXJvdXRlci9jb3JlJztcblxuaW1wb3J0IHsgU3Vic2NyaXB0aW9uLCBPYnNlcnZhYmxlLCBCZWhhdmlvclN1YmplY3QsIG9mLCBmcm9tLCBjb21iaW5lTGF0ZXN0LCBjb25jYXQgfSBmcm9tICdyeGpzJztcbmltcG9ydCB7IHN3aXRjaE1hcCwgbWFwLCB0YXAgfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5cbi8qKiBAaW50ZXJuYWwgKi9cbmludGVyZmFjZSBUcmFuc0V2dCB7XG4gIGV2dDogc3RyaW5nO1xuICB0cmFuczogVHJhbnNpdGlvbjtcbn1cblxuLyoqXG4gKiBVSVNyZWYgc3RhdHVzIGVtaXR0ZWQgZnJvbSBbW1VJU3JlZlN0YXR1c11dXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgU3JlZlN0YXR1cyB7XG4gIC8qKiBUaGUgc3JlZidzIHRhcmdldCBzdGF0ZSAob3Igb25lIG9mIGl0cyBjaGlsZHJlbikgaXMgY3VycmVudGx5IGFjdGl2ZSAqL1xuICBhY3RpdmU6IGJvb2xlYW47XG4gIC8qKiBUaGUgc3JlZidzIHRhcmdldCBzdGF0ZSBpcyBjdXJyZW50bHkgYWN0aXZlICovXG4gIGV4YWN0OiBib29sZWFuO1xuICAvKiogQSB0cmFuc2l0aW9uIGlzIGVudGVyaW5nIHRoZSBzcmVmJ3MgdGFyZ2V0IHN0YXRlICovXG4gIGVudGVyaW5nOiBib29sZWFuO1xuICAvKiogQSB0cmFuc2l0aW9uIGlzIGV4aXRpbmcgdGhlIHNyZWYncyB0YXJnZXQgc3RhdGUgKi9cbiAgZXhpdGluZzogYm9vbGVhbjtcbiAgLyoqIFRoZSBlbmNsb3NlZCBzcmVmKHMpIHRhcmdldCBzdGF0ZShzKSAqL1xuICB0YXJnZXRTdGF0ZXM6IFRhcmdldFN0YXRlW107XG59XG5cbi8qKiBAaW50ZXJuYWwgKi9cbmNvbnN0IGluYWN0aXZlU3RhdHVzOiBTcmVmU3RhdHVzID0ge1xuICBhY3RpdmU6IGZhbHNlLFxuICBleGFjdDogZmFsc2UsXG4gIGVudGVyaW5nOiBmYWxzZSxcbiAgZXhpdGluZzogZmFsc2UsXG4gIHRhcmdldFN0YXRlczogW10sXG59O1xuXG4vKipcbiAqIFJldHVybnMgYSBQcmVkaWNhdGU8UGF0aE5vZGVbXT5cbiAqXG4gKiBUaGUgcHJlZGljYXRlIHJldHVybnMgdHJ1ZSB3aGVuIHRoZSB0YXJnZXQgc3RhdGUgKGFuZCBwYXJhbSB2YWx1ZXMpXG4gKiBtYXRjaCB0aGUgKHRhaWwgb2YpIHRoZSBwYXRoLCBhbmQgdGhlIHBhdGgncyBwYXJhbSB2YWx1ZXNcbiAqXG4gKiBAaW50ZXJuYWxcbiAqL1xuY29uc3QgcGF0aE1hdGNoZXMgPSAodGFyZ2V0OiBUYXJnZXRTdGF0ZSk6IFByZWRpY2F0ZTxQYXRoTm9kZVtdPiA9PiB7XG4gIGlmICghdGFyZ2V0LmV4aXN0cygpKSByZXR1cm4gKCkgPT4gZmFsc2U7XG4gIGNvbnN0IHN0YXRlOiBTdGF0ZU9iamVjdCA9IHRhcmdldC4kc3RhdGUoKTtcbiAgY29uc3QgdGFyZ2V0UGFyYW1WYWxzID0gdGFyZ2V0LnBhcmFtcygpO1xuICBjb25zdCB0YXJnZXRQYXRoOiBQYXRoTm9kZVtdID0gUGF0aFV0aWxzLmJ1aWxkUGF0aCh0YXJnZXQpO1xuICBjb25zdCBwYXJhbVNjaGVtYTogUGFyYW1bXSA9IHRhcmdldFBhdGhcbiAgICAubWFwKChub2RlKSA9PiBub2RlLnBhcmFtU2NoZW1hKVxuICAgIC5yZWR1Y2UodW5uZXN0UiwgW10pXG4gICAgLmZpbHRlcigocGFyYW06IFBhcmFtKSA9PiB0YXJnZXRQYXJhbVZhbHMuaGFzT3duUHJvcGVydHkocGFyYW0uaWQpKTtcblxuICByZXR1cm4gKHBhdGg6IFBhdGhOb2RlW10pID0+IHtcbiAgICBjb25zdCB0YWlsTm9kZSA9IHRhaWwocGF0aCk7XG4gICAgaWYgKCF0YWlsTm9kZSB8fCB0YWlsTm9kZS5zdGF0ZSAhPT0gc3RhdGUpIHJldHVybiBmYWxzZTtcbiAgICBjb25zdCBwYXJhbVZhbHVlcyA9IFBhdGhVdGlscy5wYXJhbVZhbHVlcyhwYXRoKTtcbiAgICByZXR1cm4gUGFyYW0uZXF1YWxzKHBhcmFtU2NoZW1hLCBwYXJhbVZhbHVlcywgdGFyZ2V0UGFyYW1WYWxzKTtcbiAgfTtcbn07XG5cbi8qKlxuICogR2l2ZW4gYmFzZVBhdGg6IFthLCBiXSwgYXBwZW5kUGF0aDogW2MsIGRdKSxcbiAqIEV4cGFuZHMgdGhlIHBhdGggdG8gW2NdLCBbYywgZF1cbiAqIFRoZW4gYXBwZW5kcyBlYWNoIHRvIFthLGIsXSBhbmQgcmV0dXJuczogW2EsIGIsIGNdLCBbYSwgYiwgYywgZF1cbiAqXG4gKiBAaW50ZXJuYWxcbiAqL1xuZnVuY3Rpb24gc3ByZWFkVG9TdWJQYXRocyhiYXNlUGF0aDogUGF0aE5vZGVbXSwgYXBwZW5kUGF0aDogUGF0aE5vZGVbXSk6IFBhdGhOb2RlW11bXSB7XG4gIHJldHVybiBhcHBlbmRQYXRoLm1hcCgobm9kZSkgPT4gYmFzZVBhdGguY29uY2F0KFBhdGhVdGlscy5zdWJQYXRoKGFwcGVuZFBhdGgsIChuKSA9PiBuLnN0YXRlID09PSBub2RlLnN0YXRlKSkpO1xufVxuXG4vKipcbiAqIEdpdmVuIGEgVHJhbnNFdnQgKFRyYW5zaXRpb24gZXZlbnQ6IHN0YXJ0ZWQsIHN1Y2Nlc3MsIGVycm9yKVxuICogYW5kIGEgVUlTcmVmIFRhcmdldCBTdGF0ZSwgcmV0dXJuIGEgU3JlZlN0YXR1cyBvYmplY3RcbiAqIHdoaWNoIHJlcHJlc2VudHMgdGhlIGN1cnJlbnQgc3RhdHVzIG9mIHRoYXQgU3JlZjpcbiAqIGFjdGl2ZSwgYWN0aXZlRXEgKGV4YWN0IG1hdGNoKSwgZW50ZXJpbmcsIGV4aXRpbmdcbiAqXG4gKiBAaW50ZXJuYWxcbiAqL1xuZnVuY3Rpb24gZ2V0U3JlZlN0YXR1cyhldmVudDogVHJhbnNFdnQsIHNyZWZUYXJnZXQ6IFRhcmdldFN0YXRlKTogU3JlZlN0YXR1cyB7XG4gIGNvbnN0IHBhdGhNYXRjaGVzVGFyZ2V0ID0gcGF0aE1hdGNoZXMoc3JlZlRhcmdldCk7XG4gIGNvbnN0IHRjID0gZXZlbnQudHJhbnMudHJlZUNoYW5nZXMoKTtcblxuICBjb25zdCBpc1N0YXJ0RXZlbnQgPSBldmVudC5ldnQgPT09ICdzdGFydCc7XG4gIGNvbnN0IGlzU3VjY2Vzc0V2ZW50ID0gZXZlbnQuZXZ0ID09PSAnc3VjY2Vzcyc7XG4gIGNvbnN0IGFjdGl2ZVBhdGg6IFBhdGhOb2RlW10gPSBpc1N1Y2Nlc3NFdmVudCA/IHRjLnRvIDogdGMuZnJvbTtcblxuICBjb25zdCBpc0FjdGl2ZSA9ICgpID0+IHNwcmVhZFRvU3ViUGF0aHMoW10sIGFjdGl2ZVBhdGgpLm1hcChwYXRoTWF0Y2hlc1RhcmdldCkucmVkdWNlKGFueVRydWVSLCBmYWxzZSk7XG5cbiAgY29uc3QgaXNFeGFjdCA9ICgpID0+IHBhdGhNYXRjaGVzVGFyZ2V0KGFjdGl2ZVBhdGgpO1xuXG4gIGNvbnN0IGlzRW50ZXJpbmcgPSAoKSA9PiBzcHJlYWRUb1N1YlBhdGhzKHRjLnJldGFpbmVkLCB0Yy5lbnRlcmluZykubWFwKHBhdGhNYXRjaGVzVGFyZ2V0KS5yZWR1Y2UoYW55VHJ1ZVIsIGZhbHNlKTtcblxuICBjb25zdCBpc0V4aXRpbmcgPSAoKSA9PiBzcHJlYWRUb1N1YlBhdGhzKHRjLnJldGFpbmVkLCB0Yy5leGl0aW5nKS5tYXAocGF0aE1hdGNoZXNUYXJnZXQpLnJlZHVjZShhbnlUcnVlUiwgZmFsc2UpO1xuXG4gIHJldHVybiB7XG4gICAgYWN0aXZlOiBpc0FjdGl2ZSgpLFxuICAgIGV4YWN0OiBpc0V4YWN0KCksXG4gICAgZW50ZXJpbmc6IGlzU3RhcnRFdmVudCA/IGlzRW50ZXJpbmcoKSA6IGZhbHNlLFxuICAgIGV4aXRpbmc6IGlzU3RhcnRFdmVudCA/IGlzRXhpdGluZygpIDogZmFsc2UsXG4gICAgdGFyZ2V0U3RhdGVzOiBbc3JlZlRhcmdldF0sXG4gIH0gYXMgU3JlZlN0YXR1cztcbn1cblxuLyoqIEBpbnRlcm5hbCAqL1xuZnVuY3Rpb24gbWVyZ2VTcmVmU3RhdHVzKGxlZnQ6IFNyZWZTdGF0dXMsIHJpZ2h0OiBTcmVmU3RhdHVzKTogU3JlZlN0YXR1cyB7XG4gIHJldHVybiB7XG4gICAgYWN0aXZlOiBsZWZ0LmFjdGl2ZSB8fCByaWdodC5hY3RpdmUsXG4gICAgZXhhY3Q6IGxlZnQuZXhhY3QgfHwgcmlnaHQuZXhhY3QsXG4gICAgZW50ZXJpbmc6IGxlZnQuZW50ZXJpbmcgfHwgcmlnaHQuZW50ZXJpbmcsXG4gICAgZXhpdGluZzogbGVmdC5leGl0aW5nIHx8IHJpZ2h0LmV4aXRpbmcsXG4gICAgdGFyZ2V0U3RhdGVzOiBsZWZ0LnRhcmdldFN0YXRlcy5jb25jYXQocmlnaHQudGFyZ2V0U3RhdGVzKSxcbiAgfTtcbn1cblxuLyoqXG4gKiBBIGRpcmVjdGl2ZSB3aGljaCBlbWl0cyBldmVudHMgd2hlbiBhIHBhaXJlZCBbW1VJU3JlZl1dIHN0YXR1cyBjaGFuZ2VzLlxuICpcbiAqIFRoaXMgZGlyZWN0aXZlIGlzIHByaW1hcmlseSB1c2VkIGJ5IHRoZSBbW1VJU3JlZkFjdGl2ZV1dIGRpcmVjdGl2ZXMgdG8gbW9uaXRvciBgVUlTcmVmYChzKS5cbiAqXG4gKiBUaGlzIGRpcmVjdGl2ZSBzaGFyZXMgdHdvIGF0dHJpYnV0ZSBzZWxlY3RvcnMgd2l0aCBgVUlTcmVmQWN0aXZlYDpcbiAqXG4gKiAtIGBbdWlTcmVmQWN0aXZlXWBcbiAqIC0gYFt1aVNyZWZBY3RpdmVFcV1gLlxuICpcbiAqIFRodXMsIHdoZW5ldmVyIGEgYFVJU3JlZkFjdGl2ZWAgZGlyZWN0aXZlIGlzIGNyZWF0ZWQsIGEgYFVJU3JlZlN0YXR1c2AgZGlyZWN0aXZlIGlzIGFsc28gY3JlYXRlZC5cbiAqXG4gKiBNb3N0IGFwcHMgc2hvdWxkIHNpbXBseSB1c2UgYFVJU3JlZkFjdGl2ZWAsIGJ1dCBzb21lIGFkdmFuY2VkIGNvbXBvbmVudHMgbWF5IHdhbnQgdG8gcHJvY2VzcyB0aGVcbiAqIFtbU3JlZlN0YXR1c11dIGV2ZW50cyBkaXJlY3RseS5cbiAqXG4gKiBgYGBqc1xuICogPGxpICh1aVNyZWZTdGF0dXMpPVwib25TcmVmU3RhdHVzQ2hhbmdlZCgkZXZlbnQpXCI+XG4gKiAgIDxhIHVpU3JlZj1cImJvb2tcIiBbdWlQYXJhbXNdPVwieyBib29rSWQ6IGJvb2suaWQgfVwiPkJvb2sge3sgYm9vay5uYW1lIH19PC9hPlxuICogPC9saT5cbiAqIGBgYFxuICpcbiAqIFRoZSBgdWlTcmVmU3RhdHVzYCBldmVudCBpcyBlbWl0dGVkIHdoZW5ldmVyIGFuIGVuY2xvc2VkIGB1aVNyZWZgJ3Mgc3RhdHVzIGNoYW5nZXMuXG4gKiBUaGUgZXZlbnQgZW1pdHRlZCBpcyBvZiB0eXBlIFtbU3JlZlN0YXR1c11dLCBhbmQgaGFzIGJvb2xlYW4gdmFsdWVzIGZvciBgYWN0aXZlYCwgYGV4YWN0YCwgYGVudGVyaW5nYCwgYW5kIGBleGl0aW5nYDsgYWxzbyBoYXMgYSBbW1N0YXRlT3JOYW1lXV0gYGlkZW50aWZpZXJgdmFsdWUuXG4gKlxuICogVGhlIHZhbHVlcyBmcm9tIHRoaXMgZXZlbnQgY2FuIGJlIGNhcHR1cmVkIGFuZCBzdG9yZWQgb24gYSBjb21wb25lbnQgKHRoZW4gYXBwbGllZCwgZS5nLiwgdXNpbmcgbmdDbGFzcykuXG4gKlxuICogLS0tXG4gKlxuICogQSBzaW5nbGUgYHVpU3JlZlN0YXR1c2AgY2FuIGVuY2xvc2UgbXVsdGlwbGUgYHVpU3JlZmAuXG4gKiBFYWNoIHN0YXR1cyBib29sZWFuIChgYWN0aXZlYCwgYGV4YWN0YCwgYGVudGVyaW5nYCwgYGV4aXRpbmdgKSB3aWxsIGJlIHRydWUgaWYgKmFueSBvZiB0aGUgZW5jbG9zZWQgYHVpU3JlZmAgc3RhdHVzIGlzIHRydWUqLlxuICogSW4gb3RoZXIgd29yZHMsIGFsbCBlbmNsb3NlZCBgdWlTcmVmYCBzdGF0dXNlcyAgYXJlIG1lcmdlZCB0byBhIHNpbmdsZSBzdGF0dXMgdXNpbmcgYHx8YCAobG9naWNhbCBvcikuXG4gKlxuICogYGBganNcbiAqIDxsaSAodWlTcmVmU3RhdHVzKT1cIm9uU3JlZlN0YXR1cygkZXZlbnQpXCIgdWlTcmVmPVwiYWRtaW5cIj5cbiAqICAgSG9tZVxuICogICA8dWw+XG4gKiAgICAgPGxpPiA8YSB1aVNyZWY9XCJhZG1pbi51c2Vyc1wiPlVzZXJzPC9hPiA8L2xpPlxuICogICAgIDxsaT4gPGEgdWlTcmVmPVwiYWRtaW4uZ3JvdXBzXCI+R3JvdXBzPC9hPiA8L2xpPlxuICogICA8L3VsPlxuICogPC9saT5cbiAqIGBgYFxuICpcbiAqIEluIHRoZSBhYm92ZSBleGFtcGxlLCBgJGV2ZW50LmFjdGl2ZSA9PT0gdHJ1ZWAgd2hlbiBlaXRoZXIgYGFkbWluLnVzZXJzYCBvciBgYWRtaW4uZ3JvdXBzYCBpcyBhY3RpdmUuXG4gKlxuICogLS0tXG4gKlxuICogVGhpcyBBUEkgaXMgc3ViamVjdCB0byBjaGFuZ2UuXG4gKi9cbkBEaXJlY3RpdmUoe1xuICBzZWxlY3RvcjogJ1t1aVNyZWZTdGF0dXNdLFt1aVNyZWZBY3RpdmVdLFt1aVNyZWZBY3RpdmVFcV0nLFxuICBleHBvcnRBczogJ3VpU3JlZlN0YXR1cycsXG59KVxuZXhwb3J0IGNsYXNzIFVJU3JlZlN0YXR1cyB7XG4gIC8qKiBjdXJyZW50IHN0YXR1c2VzIG9mIHRoZSBzdGF0ZS9wYXJhbXMgdGhlIHVpU3JlZiBkaXJlY3RpdmUgaXMgbGlua2luZyB0byAqL1xuICBAT3V0cHV0KCd1aVNyZWZTdGF0dXMnKSB1aVNyZWZTdGF0dXMgPSBuZXcgRXZlbnRFbWl0dGVyPFNyZWZTdGF0dXM+KGZhbHNlKTtcbiAgLyoqIE1vbml0b3IgYWxsIGNoaWxkIGNvbXBvbmVudHMgZm9yIFVJU3JlZihzKSAqL1xuICBAQ29udGVudENoaWxkcmVuKFVJU3JlZiwgeyBkZXNjZW5kYW50czogdHJ1ZSB9KVxuICBwcml2YXRlIF9zcmVmczogUXVlcnlMaXN0PFVJU3JlZj47XG5cbiAgLyoqIFRoZSBjdXJyZW50IHN0YXR1cyAqL1xuICBzdGF0dXM6IFNyZWZTdGF0dXM7XG5cbiAgLyoqIEBpbnRlcm5hbCAqLyBwcml2YXRlIF9zdWJzY3JpcHRpb246IFN1YnNjcmlwdGlvbjtcbiAgLyoqIEBpbnRlcm5hbCAqLyBwcml2YXRlIF9zcmVmQ2hhbmdlc1N1YjogU3Vic2NyaXB0aW9uO1xuICAvKiogQGludGVybmFsICovIHByaXZhdGUgX3NyZWZzJDogQmVoYXZpb3JTdWJqZWN0PFVJU3JlZltdPjtcbiAgLyoqIEBpbnRlcm5hbCAqLyBwcml2YXRlIF9nbG9iYWxzOiBVSVJvdXRlckdsb2JhbHM7XG4gIC8qKiBAaW50ZXJuYWwgKi8gcHJpdmF0ZSBfaG9zdFVpU3JlZjogVUlTcmVmO1xuICBjb25zdHJ1Y3RvcihASG9zdCgpIEBTZWxmKCkgQE9wdGlvbmFsKCkgX2hvc3RVaVNyZWY6IFVJU3JlZiwgX2dsb2JhbHM6IFVJUm91dGVyR2xvYmFscykge1xuICAgIHRoaXMuX2dsb2JhbHMgPSBfZ2xvYmFscztcbiAgICB0aGlzLl9ob3N0VWlTcmVmID0gX2hvc3RVaVNyZWY7XG4gICAgdGhpcy5zdGF0dXMgPSBPYmplY3QuYXNzaWduKHt9LCBpbmFjdGl2ZVN0YXR1cyk7XG4gIH1cblxuICBuZ0FmdGVyQ29udGVudEluaXQoKSB7XG4gICAgLy8gTWFwIGVhY2ggdHJhbnNpdGlvbiBzdGFydCBldmVudCB0byBhIHN0cmVhbSBvZjpcbiAgICAvLyBzdGFydCAtPiAoc3VjY2Vzc3xlcnJvcilcbiAgICBjb25zdCB0cmFuc0V2ZW50cyQ6IE9ic2VydmFibGU8VHJhbnNFdnQ+ID0gdGhpcy5fZ2xvYmFscy5zdGFydCQucGlwZShcbiAgICAgIHN3aXRjaE1hcCgodHJhbnM6IFRyYW5zaXRpb24pID0+IHtcbiAgICAgICAgY29uc3QgZXZlbnQgPSAoZXZ0OiBzdHJpbmcpID0+ICh7IGV2dCwgdHJhbnMgfSBhcyBUcmFuc0V2dCk7XG5cbiAgICAgICAgY29uc3QgdHJhbnNTdGFydCQgPSBvZihldmVudCgnc3RhcnQnKSk7XG4gICAgICAgIGNvbnN0IHRyYW5zUmVzdWx0ID0gdHJhbnMucHJvbWlzZS50aGVuKFxuICAgICAgICAgICgpID0+IGV2ZW50KCdzdWNjZXNzJyksXG4gICAgICAgICAgKCkgPT4gZXZlbnQoJ2Vycm9yJylcbiAgICAgICAgKTtcbiAgICAgICAgY29uc3QgdHJhbnNGaW5pc2gkID0gZnJvbSh0cmFuc1Jlc3VsdCk7XG5cbiAgICAgICAgcmV0dXJuIGNvbmNhdCh0cmFuc1N0YXJ0JCwgdHJhbnNGaW5pc2gkKTtcbiAgICAgIH0pXG4gICAgKTtcblxuICAgIGNvbnN0IHdpdGhIb3N0U3JlZiA9IChjaGlsZHJlblNyZWZzOiBVSVNyZWZbXSkgPT5cbiAgICAgIGNoaWxkcmVuU3JlZnMuY29uY2F0KHRoaXMuX2hvc3RVaVNyZWYpLmZpbHRlcihpZGVudGl0eSkucmVkdWNlKHVuaXFSLCBbXSk7XG5cbiAgICAvLyBXYXRjaCB0aGUgQENvbnRlbnRDaGlsZHJlbiBVSVNyZWZbXSBjb21wb25lbnRzIGFuZCBnZXQgdGhlaXIgdGFyZ2V0IHN0YXRlc1xuICAgIHRoaXMuX3NyZWZzJCA9IG5ldyBCZWhhdmlvclN1YmplY3Qod2l0aEhvc3RTcmVmKHRoaXMuX3NyZWZzLnRvQXJyYXkoKSkpO1xuICAgIHRoaXMuX3NyZWZDaGFuZ2VzU3ViID0gdGhpcy5fc3JlZnMuY2hhbmdlcy5zdWJzY3JpYmUoKHNyZWZzOiBRdWVyeUxpc3Q8VUlTcmVmPikgPT5cbiAgICAgIHRoaXMuX3NyZWZzJC5uZXh0KHdpdGhIb3N0U3JlZihzcmVmcy50b0FycmF5KCkpKVxuICAgICk7XG5cbiAgICBjb25zdCB0YXJnZXRTdGF0ZXMkOiBPYnNlcnZhYmxlPFRhcmdldFN0YXRlW10+ID0gdGhpcy5fc3JlZnMkLnBpcGUoXG4gICAgICBzd2l0Y2hNYXAoKHNyZWZzOiBVSVNyZWZbXSkgPT4gY29tYmluZUxhdGVzdDxUYXJnZXRTdGF0ZVtdPihzcmVmcy5tYXAoKHNyZWYpID0+IHNyZWYudGFyZ2V0U3RhdGUkKSkpXG4gICAgKTtcblxuICAgIC8vIENhbGN1bGF0ZSB0aGUgc3RhdHVzIG9mIGVhY2ggVUlTcmVmIGJhc2VkIG9uIHRoZSB0cmFuc2l0aW9uIGV2ZW50LlxuICAgIC8vIFJlZHVjZSB0aGUgc3RhdHVzZXMgKGlmIG11bHRpcGxlKSBieSBvci1pbmcgZWFjaCBmbGFnLlxuICAgIHRoaXMuX3N1YnNjcmlwdGlvbiA9IHRyYW5zRXZlbnRzJFxuICAgICAgLnBpcGUoXG4gICAgICAgIHN3aXRjaE1hcCgoZXZ0OiBUcmFuc0V2dCkgPT4ge1xuICAgICAgICAgIHJldHVybiB0YXJnZXRTdGF0ZXMkLnBpcGUoXG4gICAgICAgICAgICBtYXAoKHRhcmdldHM6IFRhcmdldFN0YXRlW10pID0+IHtcbiAgICAgICAgICAgICAgY29uc3Qgc3RhdHVzZXM6IFNyZWZTdGF0dXNbXSA9IHRhcmdldHMubWFwKCh0YXJnZXQpID0+IGdldFNyZWZTdGF0dXMoZXZ0LCB0YXJnZXQpKTtcbiAgICAgICAgICAgICAgcmV0dXJuIHN0YXR1c2VzLnJlZHVjZShtZXJnZVNyZWZTdGF0dXMpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICApO1xuICAgICAgICB9KVxuICAgICAgKVxuICAgICAgLnN1YnNjcmliZSh0aGlzLl9zZXRTdGF0dXMuYmluZCh0aGlzKSk7XG4gIH1cblxuICBuZ09uRGVzdHJveSgpIHtcbiAgICBpZiAodGhpcy5fc3Vic2NyaXB0aW9uKSB0aGlzLl9zdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgICBpZiAodGhpcy5fc3JlZkNoYW5nZXNTdWIpIHRoaXMuX3NyZWZDaGFuZ2VzU3ViLnVuc3Vic2NyaWJlKCk7XG4gICAgaWYgKHRoaXMuX3NyZWZzJCkgdGhpcy5fc3JlZnMkLnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5fc3Vic2NyaXB0aW9uID0gdGhpcy5fc3JlZkNoYW5nZXNTdWIgPSB0aGlzLl9zcmVmcyQgPSB1bmRlZmluZWQ7XG4gIH1cblxuICBwcml2YXRlIF9zZXRTdGF0dXMoc3RhdHVzOiBTcmVmU3RhdHVzKSB7XG4gICAgdGhpcy5zdGF0dXMgPSBzdGF0dXM7XG4gICAgdGhpcy51aVNyZWZTdGF0dXMuZW1pdChzdGF0dXMpO1xuICB9XG59XG4iXX0=