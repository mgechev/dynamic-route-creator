import {Type, Injectable, Input, Component, ViewEncapsulation} from 'angular2/core';
import {
  RouteConfig,
  ROUTER_DIRECTIVES,
  RouteRegistry
} from 'angular2/router';
// import {HTTP_PROVIDERS} from 'angular2/http';

import {HomeCmp} from '../home/home';
import {AboutCmp} from '../about/about';
import {NameList} from '../../services/name_list';

@Component({
  selector: 'app-nav',
  directives: [ROUTER_DIRECTIVES],
  template: `
    <nav>
      <a *ngFor="#route of routes"
        [routerLink]="route.path">
        {{route.name}}
      </a>
    </nav>
  `
})
export class AppNav {
  @Input()
  routes: string[];
}

@Injectable()
class DynamicRouteCreator {
  constructor(private registry: RouteRegistry) {}
  addRoute(component: Type, route) {
    let routeConfig = this.getRoutes(component);
    routeConfig.configs.push(route);
    this.updateRoutes(component, routeConfig);
    this.registry.config(component, route);
  }
  removeRoute() {
    // need to touch private APIs - bad
  }
  getRoutes(component: Type) {
    return Reflect.getMetadata('annotations', component)
      .filter(a => {
        return a.constructor.name === 'RouteConfig';
      }).pop();
  }
  updateRoutes(component: Type, routeConfig) {
    let annotations = Reflect.getMetadata('annotations', component);
    let routeConfigIndex = -1;
    for (let i = 0; i < annotations.length; i += 1) {
      if (annotations[i].constructor.name === 'RouteConfig') {
        routeConfigIndex = i;
        break;
      }
    }
    if (routeConfigIndex < 0) {
      throw new Error('No route metadata attached to the component');
    }
    annotations[routeConfigIndex] = routeConfig;
    Reflect.defineMetadata('annotations', annotations, AppCmp);
  }
}

@Component({
  selector: 'app',
  viewProviders: [NameList, DynamicRouteCreator],
  templateUrl: './components/app/app.html',
  styleUrls: ['./components/app/app.css'],
  encapsulation: ViewEncapsulation.None,
  directives: [AppNav, ROUTER_DIRECTIVES]
})
@RouteConfig([
  { path: '/', component: HomeCmp, as: 'Home' }
])
export class AppCmp {
  appRoutes: string[][];
  constructor(private dynamicRouteCreator: DynamicRouteCreator) {
    this.appRoutes = this.getAppRoutes();
    setTimeout(_ => {
      let route = { path: '/about', component: AboutCmp, as: 'About' };
      this.dynamicRouteCreator.addRoute(this.constructor, route);
      this.appRoutes = this.getAppRoutes();
    }, 1000);
  }
  private getAppRoutes(): string[][] {
    return this.dynamicRouteCreator
      .getRoutes(this.constructor).configs.map(route => {
        return { path: [`/${route.as}`], name: route.as };
      });
  }
}
