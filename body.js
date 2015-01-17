function body(pos, vel, mass, id)
{
    this.pos = pos;
    this.vel = vel;
    this.acc = vec2.fromValues(0.0, 0.0);
    this.mass = mass;
    this.radius = Math.pow(mass / 4.0, 1.0 / 3.0);
    this.squaredRadius = this.radius*this.radius;
    this.id = id;
    this.eaten = 0.0;

    this.trail = [this.pos];    
    this.trailStart = 0;
    this.trailIndex = 0;

    this.TRAIL_LENGTH = 400;

    this.copy = function(newPos, newVel, newAcc, addTrail)
    {
        var ret = new body(newPos, newVel, this.mass + this.eaten, this.id);
        ret.acc = newAcc;
        ret.trail = this.trail;
        ret.trailStart = this.trailStart;
        ret.trailIndex = this.trailIndex;
        if (addTrail)
        {
            ret.trailIndex = (this.trailIndex + 1) % this.TRAIL_LENGTH;
            if (ret.trailIndex == 0)
            {
                ret.trailStart = (ret.trailStart + 1) % this.TRAIL_LENGTH;
            }
            ret.trail[ret.trailIndex] = this.pos;
        }
        return ret;
    }

    this.GetTrailPoint = function(i)
    {
        return this.trail[(this.trailStart + i) % this.TRAIL_LENGTH];
    }

}