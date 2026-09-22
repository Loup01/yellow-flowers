(function(window) {

    function loadImages(paths) {
        var images = [];

        for (var i = 0; i < paths.length; i++) {
            var img = new Image();
            img.src = paths[i];
            images.push(img);
        }

        return images;
    }

    function buildDefaultImagePaths() {
        var paths = [];

        for (var i = 1; i <= 7; i++) {
            paths.push("assets/images/flower-" + i + ".avif");
        }

        return paths;
    }

    function random(min, max) {
        return min + Math.floor(Math.random() * (max - min + 1));
    }

    function randomFloat(min, max) {
        return min + Math.random() * (max - min);
    }

    function bezier(cp, t) {  
        var p1 = cp[0].mul((1 - t) * (1 - t));
        var p2 = cp[1].mul(2 * t * (1 - t));
        var p3 = cp[2].mul(t * t); 
        return p1.add(p2).add(p3);
    }  

    function inheart(x, y, r) {
        var z = ((x / r) * (x / r) + (y / r) * (y / r) - 1) * ((x / r) * (x / r) + (y / r) * (y / r) - 1) * ((x / r) * (x / r) + (y / r) * (y / r) - 1) - (x / r) * (x / r) * (y / r) * (y / r) * (y / r);
        return z < 0;
    }

    var Point = function(x, y) {
        this.x = x || 0;
        this.y = y || 0;
    };
    Point.prototype = {
        clone: function() { return new Point(this.x, this.y); },
        add: function(o) { var p = this.clone(); p.x += o.x; p.y += o.y; return p; },
        sub: function(o) { var p = this.clone(); p.x -= o.x; p.y -= o.y; return p; },
        div: function(n) { var p = this.clone(); p.x /= n; p.y /= n; return p; },
        mul: function(n) { var p = this.clone(); p.x *= n; p.y *= n; return p; }
    };

    var Heart = function() {
        var points = [], x, y, t;
        for (var i = 10; i < 30; i += 0.2) {
            t = i / Math.PI;
            x = 16 * Math.pow(Math.sin(t), 3);
            y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
            points.push(new Point(x, y));
        }
        this.points = points;
        this.length = points.length;
    };
    Heart.prototype = {
        get: function(i, scale) { return this.points[i].mul(scale || 1); }
    };

    var Seed = function(tree, point, scale, color, label) {
        this.tree = tree;
        scale = scale || 1;
        color = color || '#FF0000';

        this.heart = {
            point  : point,
            scale  : scale,
            color  : color,
            figure : new Heart(),
            label  : label == null ? '  Flores Para Tí' : label,
        };

        this.cirle = {
            point  : point,
            scale  : scale,
            color  : color,
            radius : 5,
        };
    };
    Seed.prototype = {
        draw: function() {
            this.drawText();
            this.drawHeart();
        },
        addPosition: function(x, y) {
            this.cirle.point = this.cirle.point.add(new Point(x, y));
        },
        canMove: function() {
            return this.cirle.point.y < (this.tree.height + 20); 
        },
        move: function(x, y) {
            this.clear();
            this.drawCirle(); 
            this.addPosition(x, y);
        },
        canScale: function() {
            return this.heart.scale > 0.2;
        },
        setHeartScale: function(scale) {
            this.heart.scale *= scale;
        },
        scale: function(scale) {
            this.clear();
            this.drawCirle(); 
            this.drawHeart(); 
            this.setHeartScale(scale);
        },
        drawHeart: function() {
            var ctx = this.tree.ctx, heart = this.heart;
            var point = heart.point, scale = heart.scale;
            
            ctx.save();
            ctx.translate(point.x, point.y);
            
            var img = this.tree.images[0];
            var w = 45 * scale;
            var h = 45 * scale;
            
            if (img && img.complete && img.naturalWidth > 0) {
                ctx.drawImage(img, -w / 2, -h / 2, w, h);
            } else if (img) {
                var self = this;
                img.onload = function() {
                    self.clear();
                    self.drawText();
                    self.drawHeart();
                };
            }
            ctx.restore();
        },
        drawCirle: function() {
            var ctx = this.tree.ctx, cirle = this.cirle;
            var point = cirle.point, color = cirle.color, 
                scale = cirle.scale, radius = cirle.radius;
            ctx.save();
            ctx.fillStyle = color;
            ctx.translate(point.x, point.y);
            ctx.scale(scale, scale);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, radius, 0, 2 * Math.PI);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        },
        drawText: function() {
            var ctx = this.tree.ctx, heart = this.heart;
            var point = heart.point, color = heart.color, 
                scale = heart.scale;
            ctx.save();
            ctx.strokeStyle = color;
            ctx.fillStyle = color;
            ctx.translate(point.x, point.y);
            ctx.scale(scale, scale);
            
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(15, 15);
            ctx.lineTo(60, 15);
            ctx.stroke();

            ctx.moveTo(0, 0);
            ctx.scale(0.75, 0.75);
            ctx.font = "12px 微软雅黑,Verdana"; 
            ctx.fillText(heart.label, 23, 16);
            ctx.restore();
        },
        clear: function() {
            var ctx = this.tree.ctx, cirle = this.cirle;
            var point = cirle.point, scale = cirle.scale, radius = 26;
            var w = radius * scale, h = w;
            ctx.clearRect(point.x - w * 3, point.y - h * 3, 12 * w, 12 * h);
        },
        hover: function(x, y) {
            var point = this.heart.point;
            var dx = x - point.x;
            var dy = y - point.y;
            var distance = Math.sqrt(dx * dx + dy * dy);
            var hitRadius = Math.max(70, 28 * this.heart.scale);
            return distance <= hitRadius; 
        }
    };

    var Footer = function(tree, width, height, speed) {
        this.tree = tree;
        this.point = new Point(tree.seed.heart.point.x, tree.height - height / 2);
        this.width = width;
        this.height = height;
        this.speed = speed || 2;
        this.length = 0;
    };
    Footer.prototype = {
        draw: function() {
            var ctx = this.tree.ctx, point = this.point;
            var len = this.length / 2;

            ctx.save();
            ctx.strokeStyle = 'rgb(35, 31, 32)';
            ctx.lineWidth = this.height;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.translate(point.x, point.y);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(len, 0);
            ctx.lineTo(-len, 0);
            ctx.stroke();
            ctx.restore();

            if (this.length < this.width) {
                this.length += this.speed;
            }
        }
    };

    var Tree = function(canvas, width, height, opt) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = width;
        this.height = height;
        this.opt = opt || {};
        this.images = loadImages(this.opt.images || buildDefaultImagePaths());

        this.record = {};
        
        this.initSeed();
        this.initFooter();
        this.initBranch();
        this.initBloom();
    };
    Tree.prototype = {
        initSeed: function() {
            var seed = this.opt.seed || {};
            var x = seed.x || this.width / 2;
            var y = seed.y || this.height / 2;
            var point = new Point(x, y);
            var color = seed.color || '#FF0000';
            var scale = seed.scale || 1;
            var label = seed.label;

            this.seed = new Seed(this, point, scale, color, label);
        },

        initFooter: function() {
            var footer = this.opt.footer || {};
            var width = footer.width || this.width;
            var height = footer.height || 5;
            var speed = footer.speed || 2;
            this.footer = new Footer(this, width, height, speed);
        },

        initBranch: function() {
            var branchs = this.opt.branch || [];
            this.branchs = [];
            this.addBranchs(branchs);
        },

        initBloom: function() {
            var bloom = this.opt.bloom || {};
            var cache = [],
                num = bloom.num || 500, 
                width = bloom.width || this.width,
                height = bloom.height || this.height,
                figure = this.seed.heart.figure;
            var r = 240;
            for (var i = 0; i < num; i++) {
                cache.push(this.createBloom(width, height, r, figure));
            }
            this.blooms = [];
            this.bloomsCache = cache;
        },

        toDataURL: function(type) {
            return this.canvas.toDataURL(type);
        },

        addBranch: function(branch) {
            this.branchs.push(branch);
        },

        addBranchs: function(branchs){
            var s = this, b, p1, p2, p3, r, l, c;
            for (var i = 0; i < branchs.length; i++) {
                b = branchs[i];
                p1 = new Point(b[0], b[1]);
                p2 = new Point(b[2], b[3]);
                p3 = new Point(b[4], b[5]);
                r = b[6];
                l = b[7];
                c = b[8];
                s.addBranch(new Branch(s, p1, p2, p3, r, l, c)); 
            }
        },

        removeBranch: function(branch) {
            var branchs = this.branchs;
            for (var i = 0; i < branchs.length; i++) {
                if (branchs[i] === branch) {
                    branchs.splice(i, 1);
                }
            }
        },

        canGrow: function() {
            return !!this.branchs.length;
        },
        grow: function() {
            var branchs = this.branchs;
            for (var i = 0; i < branchs.length; i++) {
                var branch = branchs[i];
                if (branch) {
                    branch.grow();
                }
            }
        },

        addBloom: function (bloom) {
            this.blooms.push(bloom);
        },

        removeBloom: function (bloom) {
            var blooms = this.blooms;
            for (var i = 0; i < blooms.length; i++) {
                if (blooms[i] === bloom) {
                    blooms.splice(i, 1);
                }
            }
        },

        createBloom: function(width, height, radius, figure, color, alpha, angle, scale, place, speed) {
            var x, y;
            while (true) {
                x = random(20, width - 20);
                y = random(20, height - 20);
                if (inheart(x - width / 2, height - (height - 40) / 2 - y, radius)) {
                    return new Bloom(this, new Point(x, y), figure, color, alpha, angle, scale, place, speed);
                }
            }
        },
        
        canFlower: function() {
            return !!this.blooms.length;
        }, 
        flower: function(num) {
            var s = this, blooms = s.bloomsCache.splice(0, num);
            for (var i = 0; i < blooms.length; i++) {
                s.addBloom(blooms[i]);
            }
            blooms = s.blooms;
            for (var j = 0; j < blooms.length; j++) {
                blooms[j].flower();
            }
        },

        snapshot: function(k, x, y, width, height) {
            var ctx = this.ctx;
            var image = ctx.getImageData(x, y, width, height);
            var source = document.createElement('canvas');
            source.width = width;
            source.height = height;
            source.getContext('2d').putImageData(image, 0, 0);

            this.record[k] = {
                source: source,
                point: new Point(x, y),
                width: width,
                height: height
            }
        },
        move: function(k, x, y, targetScale) {
            var s = this, ctx = s.ctx;
            var rec = s.record[k || "move"];
            var point = rec.point,
                source = rec.source,
                speed = rec.speed || 10,
                width = rec.width,
                height = rec.height;

            targetScale = targetScale == null ? 1 : targetScale;

            var i = point.x + speed < x ? point.x + speed : x;
            var j = point.y + speed < y ? point.y + speed : y;

            // Shrink on its own smooth, time-based easing instead of riding the
            // position's distance-based progress, which front-loads most of the
            // scale change into the first few (fast) frames and makes the canopy
            // appear to collapse into the ground almost instantly.
            rec.scaleStep = (rec.scaleStep || 0) + 1;
            var scaleProgress = Math.min(1, rec.scaleStep / 50);
            scaleProgress = scaleProgress * scaleProgress * (3 - 2 * scaleProgress);
            var scale = 1 - (1 - targetScale) * scaleProgress;

            ctx.save();
            ctx.clearRect(point.x, point.y, width, height);
            ctx.translate(i, j + height);
            ctx.scale(scale, scale);
            ctx.drawImage(source, 0, -height, width, height);
            ctx.restore();

            rec.point = new Point(i, j);
            rec.speed = speed * 0.95;

            if (rec.speed < 2) {
                rec.speed = 2;
            }
            return i < x || j < y;
        },

        jump: function() {
            var s = this, blooms = s.blooms;
            if (blooms.length) {
                for (var i = 0; i < blooms.length; i++) {
                    blooms[i].jump();
                }
            } 
            
            if ((blooms.length && blooms.length < 15) || !blooms.length) {
                var bloom = this.opt.bloom || {},
                    width = bloom.width || this.width,
                    height = bloom.height || this.height,
                    figure = this.seed.heart.figure;
                var jumpScale = bloom.jumpScale || 1;
                var jumpSpawnMin = bloom.jumpSpawnMin || 1;
                var jumpSpawnMax = bloom.jumpSpawnMax || 2;
                var r = 240;
                
                for (var i = 0; i < random(jumpSpawnMin, jumpSpawnMax); i++) {
                    blooms.push(this.createBloom(width / 2 + width, height, r, figure, null, 1, null, jumpScale, new Point(random(-100,600), 720), random(200,300)));
                }
            }
        }
    };

    var Branch = function(tree, point1, point2, point3, radius, length, branchs) {
        this.tree = tree;
        this.point1 = point1;
        this.point2 = point2;
        this.point3 = point3;
        this.radius = radius;
        this.length = length || 100;    
        this.len = 0;
        this.t = 1 / (this.length - 1);   
        this.branchs = branchs || [];
    };

    Branch.prototype = {
        grow: function() {
            var s = this, p; 
            if (s.len <= s.length) {
                p = bezier([s.point1, s.point2, s.point3], s.len * s.t);
                s.draw(p);
                s.len += 1;
                s.radius *= 0.97;
            } else {
                s.tree.removeBranch(s);
                s.tree.addBranchs(s.branchs);
            }
        },
        draw: function(p) {
            var s = this;
            var ctx = s.tree.ctx;
            ctx.save();
            ctx.beginPath();

            ctx.fillStyle = 'rgb(139, 69, 19)';
            ctx.moveTo(p.x, p.y);
            ctx.arc(p.x, p.y, s.radius, 0, 2 * Math.PI);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }
    };

    var Bloom = function(tree, point, figure, color, alpha, angle, scale, place, speed) {
        this.tree = tree;
        this.point = point;
        
        this.imgIndex = random(0, Math.max(this.tree.images.length - 1, 0));

        this.alpha = alpha || randomFloat(0.78, 1);
        this.angle = angle || random(0, 360);
        this.scale = scale || 0.1;
        this.place = place;
        this.speed = speed;

        this.figure = figure;
    };
    Bloom.prototype = {
        setFigure: function(figure) {
            this.figure = figure;
        },
        flower: function() {
            var s = this;
            s.draw();
            s.scale += 0.1;
            if (s.scale > 1) {
                s.tree.removeBloom(s);
            }
        },
        draw: function() {
            var s = this, ctx = s.tree.ctx;

            ctx.save();
            ctx.globalAlpha = s.alpha;
            ctx.translate(s.point.x, s.point.y);
            ctx.scale(s.scale, s.scale);
            ctx.rotate(s.angle);
            
            var img = s.tree.images[s.imgIndex];
            if (img && img.complete) {
                ctx.drawImage(img, -15, -15, 30, 30);
            }

            ctx.restore();
        },
        jump: function() {
            var s = this, height = s.tree.height;

            if (s.point.x < -20 || s.point.y > height + 20) {
                s.tree.removeBloom(s);
            } else {
                s.draw();
                s.point = s.place.sub(s.point).div(s.speed * 1.1).add(s.point);
                s.angle += 0.05;
                s.speed -= 1;
            }
        }
    };

    window.Tree = Tree;

})(window);
