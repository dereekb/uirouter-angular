import { isFunction } from '@uirouter/core';
import { pick, forEach } from '@uirouter/core';
import { services } from '@uirouter/core';
import { ViewService } from '@uirouter/core';
/**
 * This is a [[StateBuilder.builder]] function for Angular `views`.
 *
 * When the [[StateBuilder]] builds a [[State]] object from a raw [[StateDeclaration]], this builder
 * handles the `views` property with logic specific to @uirouter/angular.
 *
 * If no `views: {}` property exists on the [[StateDeclaration]], then it creates the `views` object and
 * applies the state-level configuration to a view named `$default`.
 */
export function ng2ViewsBuilder(state) {
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
let id = 0;
export class Ng2ViewConfig {
    constructor(path, viewDecl) {
        this.path = path;
        this.viewDecl = viewDecl;
        this.$id = id++;
        this.loaded = true;
    }
    load() {
        return services.$q.when(this);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlld3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvc3RhdGVidWlsZGVycy92aWV3cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsVUFBVSxFQUFlLE1BQU0sZ0JBQWdCLENBQUM7QUFFekQsT0FBTyxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsTUFBTSxnQkFBZ0IsQ0FBQztBQUcvQyxPQUFPLEVBQUUsUUFBUSxFQUFFLE1BQU0sZ0JBQWdCLENBQUM7QUFDMUMsT0FBTyxFQUFFLFdBQVcsRUFBRSxNQUFNLGdCQUFnQixDQUFDO0FBRTdDOzs7Ozs7OztHQVFHO0FBQ0gsTUFBTSxVQUFVLGVBQWUsQ0FBQyxLQUFrQjtJQUNoRCxNQUFNLEtBQUssR0FBMEMsRUFBRSxFQUNyRCxXQUFXLEdBQUcsS0FBSyxDQUFDLEtBQUssSUFBSSxFQUFFLFFBQVEsRUFBRSxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUMsV0FBVyxFQUFFLFVBQVUsQ0FBQyxDQUFDLEVBQUUsQ0FBQztJQUVwRixPQUFPLENBQUMsV0FBVyxFQUFFLFVBQVUsTUFBMEIsRUFBRSxJQUFZO1FBQ3JFLElBQUksR0FBRyxJQUFJLElBQUksVUFBVSxDQUFDLENBQUMsNkNBQTZDO1FBQ3hFLElBQUksVUFBVSxDQUFDLE1BQU0sQ0FBQztZQUFFLE1BQU0sR0FBRyxFQUFFLFNBQVMsRUFBRSxNQUFhLEVBQUUsQ0FBQztRQUM5RCxJQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsTUFBTSxLQUFLLENBQUM7WUFBRSxPQUFPO1FBRTdDLE1BQU0sQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO1FBQ3JCLE1BQU0sQ0FBQyxRQUFRLEdBQUcsS0FBSyxDQUFDO1FBQ3hCLE1BQU0sQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDO1FBRXBCLE1BQU0sVUFBVSxHQUFHLFdBQVcsQ0FBQyxxQkFBcUIsQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNwRixNQUFNLENBQUMsV0FBVyxHQUFHLFVBQVUsQ0FBQyxVQUFVLENBQUM7UUFDM0MsTUFBTSxDQUFDLG9CQUFvQixHQUFHLFVBQVUsQ0FBQyxtQkFBbUIsQ0FBQztRQUU3RCxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsTUFBTSxDQUFDO0lBQ3ZCLENBQUMsQ0FBQyxDQUFDO0lBQ0gsT0FBTyxLQUFLLENBQUM7QUFDZixDQUFDO0FBRUQsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFDO0FBQ1gsTUFBTSxPQUFPLGFBQWE7SUFJeEIsWUFBbUIsSUFBZ0IsRUFBUyxRQUE0QjtRQUFyRCxTQUFJLEdBQUosSUFBSSxDQUFZO1FBQVMsYUFBUSxHQUFSLFFBQVEsQ0FBb0I7UUFIeEUsUUFBRyxHQUFXLEVBQUUsRUFBRSxDQUFDO1FBQ25CLFdBQU0sR0FBRyxJQUFJLENBQUM7SUFFNkQsQ0FBQztJQUU1RSxJQUFJO1FBQ0YsT0FBTyxRQUFRLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNoQyxDQUFDO0NBQ0YiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBpc0Z1bmN0aW9uLCBTdGF0ZU9iamVjdCB9IGZyb20gJ0B1aXJvdXRlci9jb3JlJztcbmltcG9ydCB7IFBhdGhOb2RlIH0gZnJvbSAnQHVpcm91dGVyL2NvcmUnO1xuaW1wb3J0IHsgcGljaywgZm9yRWFjaCB9IGZyb20gJ0B1aXJvdXRlci9jb3JlJztcbmltcG9ydCB7IFZpZXdDb25maWcgfSBmcm9tICdAdWlyb3V0ZXIvY29yZSc7XG5pbXBvcnQgeyBOZzJWaWV3RGVjbGFyYXRpb24gfSBmcm9tICcuLi9pbnRlcmZhY2UnO1xuaW1wb3J0IHsgc2VydmljZXMgfSBmcm9tICdAdWlyb3V0ZXIvY29yZSc7XG5pbXBvcnQgeyBWaWV3U2VydmljZSB9IGZyb20gJ0B1aXJvdXRlci9jb3JlJztcblxuLyoqXG4gKiBUaGlzIGlzIGEgW1tTdGF0ZUJ1aWxkZXIuYnVpbGRlcl1dIGZ1bmN0aW9uIGZvciBBbmd1bGFyIGB2aWV3c2AuXG4gKlxuICogV2hlbiB0aGUgW1tTdGF0ZUJ1aWxkZXJdXSBidWlsZHMgYSBbW1N0YXRlXV0gb2JqZWN0IGZyb20gYSByYXcgW1tTdGF0ZURlY2xhcmF0aW9uXV0sIHRoaXMgYnVpbGRlclxuICogaGFuZGxlcyB0aGUgYHZpZXdzYCBwcm9wZXJ0eSB3aXRoIGxvZ2ljIHNwZWNpZmljIHRvIEB1aXJvdXRlci9hbmd1bGFyLlxuICpcbiAqIElmIG5vIGB2aWV3czoge31gIHByb3BlcnR5IGV4aXN0cyBvbiB0aGUgW1tTdGF0ZURlY2xhcmF0aW9uXV0sIHRoZW4gaXQgY3JlYXRlcyB0aGUgYHZpZXdzYCBvYmplY3QgYW5kXG4gKiBhcHBsaWVzIHRoZSBzdGF0ZS1sZXZlbCBjb25maWd1cmF0aW9uIHRvIGEgdmlldyBuYW1lZCBgJGRlZmF1bHRgLlxuICovXG5leHBvcnQgZnVuY3Rpb24gbmcyVmlld3NCdWlsZGVyKHN0YXRlOiBTdGF0ZU9iamVjdCkge1xuICBjb25zdCB2aWV3czogeyBba2V5OiBzdHJpbmddOiBOZzJWaWV3RGVjbGFyYXRpb24gfSA9IHt9LFxuICAgIHZpZXdzT2JqZWN0ID0gc3RhdGUudmlld3MgfHwgeyAkZGVmYXVsdDogcGljayhzdGF0ZSwgWydjb21wb25lbnQnLCAnYmluZGluZ3MnXSkgfTtcblxuICBmb3JFYWNoKHZpZXdzT2JqZWN0LCBmdW5jdGlvbiAoY29uZmlnOiBOZzJWaWV3RGVjbGFyYXRpb24sIG5hbWU6IHN0cmluZykge1xuICAgIG5hbWUgPSBuYW1lIHx8ICckZGVmYXVsdCc7IC8vIEFjY291bnQgZm9yIHZpZXdzOiB7IFwiXCI6IHsgdGVtcGxhdGUuLi4gfSB9XG4gICAgaWYgKGlzRnVuY3Rpb24oY29uZmlnKSkgY29uZmlnID0geyBjb21wb25lbnQ6IGNvbmZpZyBhcyBhbnkgfTtcbiAgICBpZiAoT2JqZWN0LmtleXMoY29uZmlnKS5sZW5ndGggPT09IDApIHJldHVybjtcblxuICAgIGNvbmZpZy4kdHlwZSA9ICduZzInO1xuICAgIGNvbmZpZy4kY29udGV4dCA9IHN0YXRlO1xuICAgIGNvbmZpZy4kbmFtZSA9IG5hbWU7XG5cbiAgICBjb25zdCBub3JtYWxpemVkID0gVmlld1NlcnZpY2Uubm9ybWFsaXplVUlWaWV3VGFyZ2V0KGNvbmZpZy4kY29udGV4dCwgY29uZmlnLiRuYW1lKTtcbiAgICBjb25maWcuJHVpVmlld05hbWUgPSBub3JtYWxpemVkLnVpVmlld05hbWU7XG4gICAgY29uZmlnLiR1aVZpZXdDb250ZXh0QW5jaG9yID0gbm9ybWFsaXplZC51aVZpZXdDb250ZXh0QW5jaG9yO1xuXG4gICAgdmlld3NbbmFtZV0gPSBjb25maWc7XG4gIH0pO1xuICByZXR1cm4gdmlld3M7XG59XG5cbmxldCBpZCA9IDA7XG5leHBvcnQgY2xhc3MgTmcyVmlld0NvbmZpZyBpbXBsZW1lbnRzIFZpZXdDb25maWcge1xuICAkaWQ6IG51bWJlciA9IGlkKys7XG4gIGxvYWRlZCA9IHRydWU7XG5cbiAgY29uc3RydWN0b3IocHVibGljIHBhdGg6IFBhdGhOb2RlW10sIHB1YmxpYyB2aWV3RGVjbDogTmcyVmlld0RlY2xhcmF0aW9uKSB7fVxuXG4gIGxvYWQoKSB7XG4gICAgcmV0dXJuIHNlcnZpY2VzLiRxLndoZW4odGhpcyk7XG4gIH1cbn1cbiJdfQ==