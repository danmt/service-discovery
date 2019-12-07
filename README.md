# Microservices: API Gateways and Service Discovery with Nx and NestJs

This article intention is to give you a broader perspective into the Microservices architecture. There's many people out there claiming they have a Microservice oriented architecture but they lack of the core concepts on which this pattern relies. My goal is to write a set of articles looking to clear all the fog that appears when shifting from monolithic to highly distributed application.

The Microservices world is full of interesting and incredibly hard to implement stuff. When you get started you think that by just dividing your app in multiple services you are already there. Sadly, that's almost never true. It's more common than you think to see people building highly critical apps in this way without having in place all the core concepts.

In this article I'm going to focus in two patterns API Gateway and Service Discovery. If you are doing Microservice architecture you **SHOULD** know these two pretty well, being that the case use this article to make sure you have clear knowledge on these concepts. If you are enterily new to Microservices, have fun and enjoy the ride.

In traditional monolithic applications, API clients consume everything from the same location. Although, once you start using microservices things start to change, you may have multiple services running on entirely different locations. Typically those locations aren't static so that has to be taken into account.

## What API Gateway means

The non deterministic nature of microservice architecture lead us directly to whole new mess. But what can you do about it? One of the approaches out there is the API Gateway. From a 10,000ft view it's just an extra service that you put in front of your other services so you can do composition of services.

## What Service Discovery means

Imagine you have multiple distributed services which can be running (or NOT). You don't want to manually handle all those services, instead is better if you have some code to do these:

- Verify if there's an instance of the service running
- If there's no instance of the service running
  - Start a new instance of the service
- Return the service location

You are basically setting everything so your Service Discovery implementation is the responsible of managing the services. If you want to implement your own Load Balancer, this will put you into the right direction.

## The problem you are going to solve

Let's say you have an application that consists on multiple services, each of these running in the same physical server under different ports. We want to have our services location hidden from clients, so we'll have a proxy service that has to be able to compose multiple requests. It has to be capable of instatiating other services when needed and keeping track of their locations and status.

> NOTE: All the services have a heart beat mechanism built in, so if they spend too much time idle they get shutted down. We can't forget to wipe that from the available services.

## Solution

### How the services work

Let's analyse how the services work. A Service has a single endpoint that can be accessed through `http://localhost:${port}/hello`. Once they start:

- Get assigned a random available port
- Send the port through inter process communication
- Start a heart beat mechanism

If you are wondering what I mean by _heart beat mechanism_, is simply a class that receives a serviceName and a configuration object. Once the heartBeat instance is initiated it will start an interval and will check with a predefined frequency if the service has reached the maximum time idle.

> NOTE: The frequency of the interval and the maximum time idle are part of the configuration and can be modified if needed.

Once the service reaches the maximum time idle, the entire process is killed.

### How the API works

Since our services run in the same server, from the API service we can start a new service instance. The API service has to keep track of the services location and status. Clients will perform requests to the API service and it will take care of redirecting and composing service consumption.

## Implementation

All I've said sounds nice right? But before continuing I highly recommend you to take a step back and think.

> How would I solve it?
